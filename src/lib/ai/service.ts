import {
  AI_UNAVAILABLE_MESSAGES,
  AiConceptSchema,
  AiExplanationSchema,
  type AiConcept,
  type AiExplanation,
  type AiOutcome,
  type AiUnavailableReason,
  type ExplainRequest,
} from "./schemas";
import type { LlmClient } from "./gemini-client";
import {
  CONCEPT_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
  buildAiPayloadFromAnswers,
  buildConceptUserPrompt,
  buildExplainUserPrompt,
} from "./prompt";
import { containsForbiddenClaim, isConsistentWithEngine } from "./sanitize";

/**
 * SERVICIO DE IA
 * ---------------------------------------------------------------------------
 * - Nunca cambia el resultado del motor: lo recalcula y solo lo pasa como contexto.
 * - Cualquier fallo se traduce en { available: false, reason } y el llamador
 *   sigue mostrando los resultados deterministas.
 * - NUNCA se fabrica texto de IA cuando falla.
 */

export const AI_TIMEOUT_MS = 20_000;

function unavailable(reason: AiUnavailableReason): AiOutcome<never> {
  return { available: false, reason, message: AI_UNAVAILABLE_MESSAGES[reason] };
}

/** Traduce un error del SDK o de red al motivo de indisponibilidad. */
export function classifyError(err: unknown): AiUnavailableReason {
  const e = err as { name?: string; status?: number; code?: number | string; message?: string };
  const msg = String(e?.message ?? "").toLowerCase();
  if (e?.name === "AbortError" || e?.name === "TimeoutError" || msg.includes("aborted") || msg.includes("timed out")) {
    return "timeout";
  }
  if (
    e?.status === 429 ||
    e?.code === 429 ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("rate limit")
  ) {
    return "quota";
  }
  return "error";
}

/** Extrae un objeto JSON de la respuesta (tolera cercos ```json). */
export function parseJsonLoose(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

async function callWithTimeout(
  client: LlmClient,
  system: string,
  user: string,
  timeoutMs: number,
): Promise<string> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      const err = new Error("timed out");
      err.name = "TimeoutError";
      reject(err);
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      client.generate({ system, user, signal: controller.signal }),
      timeout,
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface AiDeps {
  /** null = IA no configurada. */
  client: LlmClient | null;
  timeoutMs?: number;
}

/** Explica el diagnóstico. El resultado del motor se recalcula en el servidor. */
export async function explainResult(
  request: ExplainRequest,
  deps: AiDeps,
): Promise<AiOutcome<AiExplanation>> {
  if (!deps.client) return unavailable("not_configured");

  const { payload, result } = buildAiPayloadFromAnswers(request.entityType, request.answers);

  let raw: string;
  try {
    raw = await callWithTimeout(
      deps.client,
      SYSTEM_PROMPT,
      buildExplainUserPrompt(payload),
      deps.timeoutMs ?? AI_TIMEOUT_MS,
    );
  } catch (err) {
    return unavailable(classifyError(err));
  }

  let parsed: AiExplanation;
  try {
    parsed = AiExplanationSchema.parse(parseJsonLoose(raw));
  } catch {
    return unavailable("invalid_response");
  }

  const allText = [
    parsed.executiveSummary,
    parsed.explanation,
    parsed.uncertainty,
    ...parsed.prioritizedActions.flatMap((a) => [a.title, a.detail]),
  ].join("\n");

  if (!isConsistentWithEngine(allText, result.tier ?? 0)) {
    return unavailable("invalid_response");
  }

  return { available: true, data: parsed, model: deps.client.model };
}

/** Explica un concepto técnico solicitado por el usuario. */
export async function explainConcept(
  concept: string,
  organizationType: string | undefined,
  deps: AiDeps,
): Promise<AiOutcome<AiConcept>> {
  if (!deps.client) return unavailable("not_configured");

  let raw: string;
  try {
    raw = await callWithTimeout(
      deps.client,
      CONCEPT_SYSTEM_PROMPT,
      buildConceptUserPrompt(concept, organizationType),
      deps.timeoutMs ?? AI_TIMEOUT_MS,
    );
  } catch (err) {
    return unavailable(classifyError(err));
  }

  let parsed: AiConcept;
  try {
    parsed = AiConceptSchema.parse(parseJsonLoose(raw));
  } catch {
    return unavailable("invalid_response");
  }
  if (containsForbiddenClaim(parsed.explanation)) return unavailable("invalid_response");

  return { available: true, data: parsed, model: deps.client.model };
}
