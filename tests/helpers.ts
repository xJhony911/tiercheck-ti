import type { Answers } from "@/domain/types";
import { DEMO_SCENARIOS } from "@/domain/scenarios/scenarios";

export function scenarioAnswers(id: string): Answers {
  const s = DEMO_SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`Escenario inexistente: ${id}`);
  return { ...s.answers };
}

/** Respuestas coherentes con una infraestructura con características de Tier IV. */
export function tier4Answers(): Answers {
  return {
    ...scenarioAnswers("concurrent"),
    D1: "2n",
    D2: "n1",
    D3: "n1",
    E1: "two_active",
    E2: "two_active",
    E5: "yes",
    F1: "yes",
    F2: "yes",
  };
}

/** Devuelve una copia de `base` con las claves sobrescritas (undefined elimina la clave). */
export function withAnswers(
  base: Answers,
  overrides: Record<string, string | undefined>,
): Answers {
  const out: Answers = { ...base };
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete out[k];
    else out[k] = v;
  }
  return out;
}
