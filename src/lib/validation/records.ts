import { z } from "zod";
import { QUESTION_BY_ID } from "@/domain/questionnaire/questions";
import { isValidAnswer } from "@/domain/questionnaire/visibility";
import type { EvaluationResult } from "@/domain/types";
import { EntityInfoSchema } from "./entity";

/**
 * Esquemas para validar datos leídos de localStorage.
 * Los datos pueden estar corruptos o haber sido editados a mano, por lo que
 * nunca se confía en ellos sin validar.
 */

export const AnswersSchema = z.record(z.string(), z.string()).superRefine((a, ctx) => {
  for (const [qid, value] of Object.entries(a)) {
    const q = QUESTION_BY_ID[qid];
    if (!q || !isValidAnswer(q, value)) {
      ctx.addIssue({ code: "custom", message: `Respuesta inválida: ${qid}` });
    }
  }
});

/** Comprobación mínima de forma del resultado almacenado. */
function isResultLike(value: unknown): value is EvaluationResult {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.status === "string" &&
    typeof r.label === "string" &&
    typeof r.summary === "string" &&
    typeof r.rulesVersion === "string" &&
    Array.isArray(r.met) &&
    Array.isArray(r.notMet) &&
    Array.isArray(r.unknown) &&
    Array.isArray(r.categoryScores) &&
    typeof r.coverage === "object" &&
    r.coverage !== null
  );
}

export const StoredAiSchema = z.object({
  model: z.string(),
  generatedAt: z.string(),
  executiveSummary: z.string(),
  explanation: z.string(),
  prioritizedActions: z.array(z.object({ title: z.string(), detail: z.string() })),
  uncertainty: z.string(),
});
export type StoredAi = z.infer<typeof StoredAiSchema>;

export const EvaluationRecordSchema = z.object({
  id: z.string().min(1).max(64),
  createdAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Fecha inválida"),
  entity: EntityInfoSchema,
  answers: AnswersSchema,
  result: z.custom<EvaluationResult>(isResultLike, "Resultado inválido"),
  ai: StoredAiSchema.optional(),
  /** true si proviene de un escenario de demostración (datos simulados). */
  simulated: z.boolean().optional(),
});

export type EvaluationRecord = z.infer<typeof EvaluationRecordSchema>;

export const DraftSchema = z.object({
  entity: z
    .object({
      organizationName: z.string().optional(),
      entityType: z.string().optional(),
      facilityType: z.string().optional(),
      observations: z.string().optional(),
    })
    .default({}),
  answers: z.record(z.string(), z.string()).default({}),
  /** Paso actual del asistente: "entity" o id de categoría "A"-"F" o "review". */
  step: z.string().default("entity"),
  simulated: z.boolean().optional(),
});
export type Draft = z.infer<typeof DraftSchema>;
