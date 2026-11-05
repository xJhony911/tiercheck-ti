import { describe, expect, it } from "vitest";
import {
  DRAFT_KEY,
  DraftStore,
  HISTORY_KEY,
  LocalEvaluationRepository,
  MAX_HISTORY,
  MemoryStorage,
  createRecord,
} from "@/lib/storage/repository";
import { validateEntity } from "@/lib/validation/entity";
import { DEMO_SCENARIOS } from "@/domain/scenarios/scenarios";
import { scenarioAnswers } from "./helpers";

const entity = {
  entityType: "empresa" as const,
  facilityType: "Sala de servidores",
};

describe("Historial en almacenamiento local", () => {
  it("guarda, lista, consulta y elimina evaluaciones", () => {
    const repo = new LocalEvaluationRepository(new MemoryStorage());
    const a = createRecord(entity, scenarioAnswers("basic"), { now: new Date("2026-01-01") });
    const b = createRecord(entity, scenarioAnswers("redundant"), { now: new Date("2026-02-01") });
    repo.save(a);
    repo.save(b);

    const list = repo.list();
    expect(list.map((r) => r.id)).toEqual([b.id, a.id]); // más reciente primero
    expect(repo.get(a.id)?.result.tier).toBe(1);
    expect(repo.get(b.id)?.result.tier).toBe(2);

    repo.remove(a.id);
    expect(repo.list().map((r) => r.id)).toEqual([b.id]);
    expect(repo.get(a.id)).toBeUndefined();

    repo.clear();
    expect(repo.list()).toEqual([]);
  });

  it("guarda el resultado del motor junto con la evaluación", () => {
    const rec = createRecord(entity, scenarioAnswers("concurrent"));
    expect(rec.result.tier).toBe(3);
    expect(rec.result.rulesVersion).toBeTruthy();
  });

  it("actualiza la explicación de IA sin alterar el resultado del motor", () => {
    const repo = new LocalEvaluationRepository(new MemoryStorage());
    const rec = createRecord(entity, scenarioAnswers("redundant"));
    repo.save(rec);
    repo.update(rec.id, {
      ai: {
        model: "m",
        generatedAt: new Date().toISOString(),
        executiveSummary: "Resumen de prueba largo.",
        explanation: "Explicación de prueba larga.",
        prioritizedActions: [],
        uncertainty: "Incertidumbre.",
      },
    });
    const stored = repo.get(rec.id);
    expect(stored?.ai?.model).toBe("m");
    expect(stored?.result).toEqual(rec.result);
  });

  it("ignora JSON corrupto sin lanzar errores", () => {
    const storage = new MemoryStorage();
    storage.setItem(HISTORY_KEY, "{esto no es json");
    expect(new LocalEvaluationRepository(storage).list()).toEqual([]);
    storage.setItem(HISTORY_KEY, JSON.stringify({ no: "es un arreglo" }));
    expect(new LocalEvaluationRepository(storage).list()).toEqual([]);
  });

  it("descarta registros inválidos pero conserva los válidos", () => {
    const storage = new MemoryStorage();
    const repo = new LocalEvaluationRepository(storage);
    const good = createRecord(entity, scenarioAnswers("basic"));
    storage.setItem(
      HISTORY_KEY,
      JSON.stringify([good, { id: "x", createdAt: "ayer", entity: {}, answers: { ZZ: "q" } }]),
    );
    expect(repo.list().map((r) => r.id)).toEqual([good.id]);
  });

  it("limita el tamaño del historial", () => {
    const repo = new LocalEvaluationRepository(new MemoryStorage());
    for (let i = 0; i < MAX_HISTORY + 5; i++) {
      repo.save(createRecord(entity, scenarioAnswers("basic")));
    }
    expect(repo.list().length).toBe(MAX_HISTORY);
  });

  it("marca como simuladas las evaluaciones de demostración", () => {
    const s = DEMO_SCENARIOS[0];
    const rec = createRecord(s.entity, s.answers, { simulated: true });
    expect(rec.simulated).toBe(true);
  });
});

describe("Borrador del cuestionario", () => {
  it("conserva y recupera respuestas temporalmente", () => {
    const store = new DraftStore(new MemoryStorage());
    expect(store.load()).toBeNull();
    store.save({ entity: { entityType: "empresa" }, answers: { A1: "yes" }, step: "B" });
    expect(store.load()?.answers).toEqual({ A1: "yes" });
    expect(store.load()?.step).toBe("B");
    store.clear();
    expect(store.load()).toBeNull();
  });

  it("ignora borradores corruptos", () => {
    const storage = new MemoryStorage();
    storage.setItem(DRAFT_KEY, "###");
    expect(new DraftStore(storage).load()).toBeNull();
  });
});

describe("Validación de datos generales", () => {
  it("acepta datos válidos con nombre y observaciones opcionales", () => {
    expect(validateEntity({ entityType: "universidad", facilityType: "Centro de datos institucional" })).toEqual({});
    expect(
      validateEntity({
        organizationName: "Universidad de Prueba",
        entityType: "universidad",
        facilityType: "Sala de servidores",
        observations: "Sala en segundo piso.",
      }),
    ).toEqual({});
  });

  it("exige tipo de entidad y tipo de instalación", () => {
    const errors = validateEntity({ facilityType: "" });
    expect(errors.entityType).toBeTruthy();
    expect(errors.facilityType).toBeTruthy();
  });

  it("rechaza textos que parecen claves o datos sensibles", () => {
    const errors = validateEntity({
      entityType: "empresa",
      facilityType: "Sala",
      observations: "la contraseña: Admin12345",
    });
    expect(errors.observations).toBeTruthy();
  });

  it("limita la longitud de observaciones", () => {
    const errors = validateEntity({
      entityType: "empresa",
      facilityType: "Sala",
      observations: "x ".repeat(400),
    });
    expect(errors.observations).toBeTruthy();
  });
});
