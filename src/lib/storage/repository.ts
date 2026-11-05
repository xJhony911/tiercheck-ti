import { evaluateTier } from "@/domain/rules/engine";
import type { Answers, EntityInfo } from "@/domain/types";
import {
  DraftSchema,
  EvaluationRecordSchema,
  type Draft,
  type EvaluationRecord,
  type StoredAi,
} from "@/lib/validation/records";

/**
 * Persistencia local (localStorage) detrás de una interfaz.
 * Para pasar a una base de datos bastaría con implementar `EvaluationRepository`
 * de nuevo (sin tocar la interfaz de usuario).
 */

export const HISTORY_KEY = "tiercheck:history:v1";
export const DRAFT_KEY = "tiercheck:draft:v1";
export const MAX_HISTORY = 50;

/** Subconjunto de la API Storage que usamos (facilita las pruebas). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface EvaluationRepository {
  list(): EvaluationRecord[];
  get(id: string): EvaluationRecord | undefined;
  save(record: EvaluationRecord): void;
  update(id: string, patch: Partial<Pick<EvaluationRecord, "ai">>): void;
  remove(id: string): void;
  clear(): void;
}

function newId(): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `ev-${Date.now().toString(36)}-${rand}`;
}

/** Crea un registro nuevo calculando el resultado con el motor determinista. */
export function createRecord(
  entity: EntityInfo,
  answers: Answers,
  options: { simulated?: boolean; now?: Date } = {},
): EvaluationRecord {
  return {
    id: newId(),
    createdAt: (options.now ?? new Date()).toISOString(),
    entity,
    answers,
    result: evaluateTier(answers),
    simulated: options.simulated,
  };
}

export class LocalEvaluationRepository implements EvaluationRepository {
  constructor(private readonly storage: KeyValueStorage) {}

  /** Lee y valida; descarta entradas corruptas sin lanzar errores. */
  list(): EvaluationRecord[] {
    const raw = this.storage.getItem(HISTORY_KEY);
    if (!raw) return [];
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return [];
    }
    if (!Array.isArray(data)) return [];
    const records: EvaluationRecord[] = [];
    for (const item of data) {
      const parsed = EvaluationRecordSchema.safeParse(item);
      if (parsed.success) records.push(parsed.data);
    }
    return records.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  get(id: string): EvaluationRecord | undefined {
    return this.list().find((r) => r.id === id);
  }

  save(record: EvaluationRecord): void {
    const others = this.list().filter((r) => r.id !== record.id);
    this.write([record, ...others].slice(0, MAX_HISTORY));
  }

  update(id: string, patch: { ai?: StoredAi }): void {
    const records = this.list().map((r) => (r.id === id ? { ...r, ...patch } : r));
    this.write(records);
  }

  remove(id: string): void {
    this.write(this.list().filter((r) => r.id !== id));
  }

  clear(): void {
    this.storage.removeItem(HISTORY_KEY);
  }

  private write(records: EvaluationRecord[]) {
    this.storage.setItem(HISTORY_KEY, JSON.stringify(records));
  }
}

/** Borrador del cuestionario (conservación temporal de respuestas). */
export class DraftStore {
  constructor(private readonly storage: KeyValueStorage) {}

  load(): Draft | null {
    const raw = this.storage.getItem(DRAFT_KEY);
    if (!raw) return null;
    try {
      const parsed = DraftSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  save(draft: Draft): void {
    this.storage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  clear(): void {
    this.storage.removeItem(DRAFT_KEY);
  }
}

/** Devuelve localStorage si está disponible (navegador), o un almacén en memoria. */
export function getBrowserStorage(): KeyValueStorage {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const probe = "__tiercheck_probe__";
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      return window.localStorage;
    }
  } catch {
    /* modo privado o almacenamiento bloqueado */
  }
  return new MemoryStorage();
}

export class MemoryStorage implements KeyValueStorage {
  private map = new Map<string, string>();
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}
