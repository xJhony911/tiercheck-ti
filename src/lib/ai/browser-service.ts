import {
  AiConceptSchema,
  AiExplanationSchema,
  type AiConcept,
  type AiExplanation,
  type AiOutcome,
  type AiUnavailableReason,
} from "./schemas";
import {
  CONCEPT_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
  buildAiPayloadFromAnswers,
  buildConceptUserPrompt,
  buildExplainUserPrompt,
} from "./prompt";
import { containsForbiddenClaim, isConsistentWithEngine } from "./sanitize";
import { parseJsonLoose } from "./service";
import type { Answers } from "@/domain/types";

const CANDIDATE_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite"];

async function callGeminiRest(
  apiKey: string,
  systemInstruction: string,
  userPrompt: string,
): Promise<{ text: string; model: string }> {
  let lastError: unknown = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = (errorData as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`;
        lastError = new Error(msg);
        continue;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return { text, model };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error("Respuesta vacía o error al conectar con Google Gemini.");
}

function classifyClientError(err: unknown): { reason: AiUnavailableReason; message: string } {
  const msg = String((err as { message?: string })?.message ?? "").toLowerCase();
  if (msg.includes("api_key") || msg.includes("api key") || msg.includes("permission") || msg.includes("403")) {
    return {
      reason: "not_configured",
      message: "La clave de API ingresada es inválida o no tiene permisos. Revise la clave configurada.",
    };
  }
  if (msg.includes("quota") || msg.includes("resource_exhausted") || msg.includes("429")) {
    return {
      reason: "quota",
      message: "Se agotó la cuota de la clave de Gemini ingresada. Intente de nuevo más tarde.",
    };
  }
  if (msg.includes("abort") || msg.includes("timeout")) {
    return {
      reason: "timeout",
      message: "El servicio de Google Gemini tardó demasiado en responder.",
    };
  }
  return {
    reason: "error",
    message: "No se pudo obtener la respuesta de IA de Google Gemini. Compruebe su conexión o su clave.",
  };
}

export async function directGenerateExplanation(
  apiKey: string,
  entityType: string | undefined,
  answers: Answers,
): Promise<AiOutcome<AiExplanation>> {
  const { payload, result } = buildAiPayloadFromAnswers(entityType ?? "general", answers);

  let raw: string;
  let usedModel = CANDIDATE_MODELS[0];
  try {
    const res = await callGeminiRest(apiKey, SYSTEM_PROMPT, buildExplainUserPrompt(payload));
    raw = res.text;
    usedModel = res.model;
  } catch (err) {
    const { reason, message } = classifyClientError(err);
    return { available: false, reason, message };
  }

  let parsed: AiExplanation;
  try {
    parsed = AiExplanationSchema.parse(parseJsonLoose(raw));
  } catch {
    return {
      available: false,
      reason: "invalid_response",
      message: "La respuesta generada por la IA no tuvo el formato esperado.",
    };
  }

  const allText = [
    parsed.executiveSummary,
    parsed.explanation,
    parsed.uncertainty,
    ...parsed.prioritizedActions.flatMap((a) => [a.title, a.detail]),
  ].join("\n");

  if (!isConsistentWithEngine(allText, result.tier ?? 0)) {
    return {
      available: false,
      reason: "invalid_response",
      message: "La explicación generada no coincide con el resultado técnico del motor.",
    };
  }

  return { available: true, data: parsed, model: usedModel };
}

export async function directExplainConcept(
  apiKey: string,
  concept: string,
  organizationType: string | undefined,
): Promise<AiOutcome<AiConcept>> {
  let raw: string;
  let usedModel = CANDIDATE_MODELS[0];
  try {
    const res = await callGeminiRest(
      apiKey,
      CONCEPT_SYSTEM_PROMPT,
      buildConceptUserPrompt(concept, organizationType),
    );
    raw = res.text;
    usedModel = res.model;
  } catch (err) {
    const { reason, message } = classifyClientError(err);
    return { available: false, reason, message };
  }

  let parsed: AiConcept;
  try {
    parsed = AiConceptSchema.parse(parseJsonLoose(raw));
  } catch {
    return {
      available: false,
      reason: "invalid_response",
      message: "La respuesta técnica generada no tuvo el formato esperado.",
    };
  }

  if (containsForbiddenClaim(parsed.explanation)) {
    return {
      available: false,
      reason: "invalid_response",
      message: "La respuesta contenía afirmaciones no permitidas.",
    };
  }

  return { available: true, data: parsed, model: usedModel };
}
