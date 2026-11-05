import { DraftStore, LocalEvaluationRepository, getBrowserStorage } from "@/lib/storage/repository";

/**
 * Instancias únicas de los repositorios para el navegador.
 * Llamar SOLO desde efectos o manejadores de eventos (no durante el render del servidor).
 */
let repo: LocalEvaluationRepository | null = null;
let draft: DraftStore | null = null;

export function getRepository(): LocalEvaluationRepository {
  repo ??= new LocalEvaluationRepository(getBrowserStorage());
  return repo;
}

export function getDraftStore(): DraftStore {
  draft ??= new DraftStore(getBrowserStorage());
  return draft;
}
