import { z } from "zod";
import { QUESTION_BY_ID } from "@/domain/questionnaire/questions";
import { isValidAnswer } from "@/domain/questionnaire/visibility";
import { containsSecretPattern } from "./sanitize";

/**
 * Esquemas Zod de entrada/salida del módulo de IA.
 *
 * La entrada de /api/ai/explain contiene SOLO el tipo de entidad y las
 * respuestas técnicas. El servidor recalcula el resultado con el motor
 * determinista: el cliente no puede inyectar un "resultado" falso.
 */

export const ENTITY_TYPES = ["empresa", "universidad", "institucion_publica", "otra"] as const;

export const ExplainRequestSchema = z.object({
  entityType: z.enum(ENTITY_TYPES),
  answers: z
    .record(z.string().max(8), z.string().max(32))
    .refine((a) => Object.keys(a).length <= 40, "Demasiadas respuestas.")
    .superRefine((a, ctx) => {
      for (const [qid, value] of Object.entries(a)) {
        const q = QUESTION_BY_ID[qid];
        if (!q) {
          ctx.addIssue({ code: "custom", message: `Pregunta desconocida: ${qid}` });
        } else if (!isValidAnswer(q, value)) {
          ctx.addIssue({ code: "custom", message: `Respuesta inválida para ${qid}` });
        }
      }
    }),
});
export type ExplainRequest = z.infer<typeof ExplainRequestSchema>;

export const ConceptRequestSchema = z.object({
  concept: z
    .string()
    .trim()
    .min(3, "Escriba un concepto o pregunta de al menos 3 caracteres.")
    .max(200, "El texto es demasiado largo (máximo 200 caracteres).")
    .refine((t) => !containsSecretPattern(t), {
      message: "El texto parece contener una clave o secreto. No lo incluya.",
    }),
  entityType: z.enum(ENTITY_TYPES).optional(),
});
export type ConceptRequest = z.infer<typeof ConceptRequestSchema>;

/** Salida estructurada que se pide a Gemini para el diagnóstico. */
export const AiExplanationSchema = z.object({
  executiveSummary: z.string().min(10).max(1500),
  explanation: z.string().min(10).max(3000),
  prioritizedActions: z
    .array(
      z.object({
        title: z.string().min(3).max(160),
        detail: z.string().min(3).max(800),
      }),
    )
    .max(8),
  uncertainty: z.string().min(3).max(800),
});
export type AiExplanation = z.infer<typeof AiExplanationSchema>;

export const AiConceptSchema = z.object({
  explanation: z.string().min(10).max(2500),
});
export type AiConcept = z.infer<typeof AiConceptSchema>;

/** Motivos por los que la IA puede no estar disponible. */
export type AiUnavailableReason =
  | "not_configured"
  | "quota"
  | "timeout"
  | "invalid_response"
  | "rate_limited"
  | "error";

export type AiOutcome<T> =
  | { available: true; data: T; model: string }
  | { available: false; reason: AiUnavailableReason; message: string };

export const AI_UNAVAILABLE_MESSAGES: Record<AiUnavailableReason, string> = {
  not_configured:
    "La personalización con IA no está disponible: no hay una clave de Gemini configurada en el servidor.",
  quota:
    "La personalización con IA no está disponible: se excedió la cuota o el límite de la API de Gemini.",
  timeout:
    "La personalización con IA no está disponible: la solicitud tardó demasiado.",
  invalid_response:
    "La personalización con IA no está disponible: la respuesta recibida no cumplió las validaciones de seguridad y fue descartada.",
  rate_limited:
    "Se alcanzó el límite de solicitudes de IA. Intente de nuevo en unos instantes.",
  error:
    "La personalización con IA no está disponible por un error del servicio.",
};
