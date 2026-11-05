import {
  AI_UNAVAILABLE_MESSAGES,
  type AiConcept,
  type AiExplanation,
  type AiOutcome,
  type AiUnavailableReason,
} from "./schemas";
import { getUserApiKey } from "./user-key";
import { directGenerateExplanation, directExplainConcept } from "./browser-service";

/**
 * Cliente del navegador para las funciones de IA.
 * - Si el usuario configuró su propia clave de Gemini en el navegador (BYOK),
 *   consulta directamente a Google Gemini vía REST (funciona en GitHub Pages y en local).
 * - Si no hay clave de usuario, intenta consultar las rutas /api/ai/* del servidor.
 * - Nunca lanza: cualquier fallo se convierte en { available: false } para que la
 *   interfaz siga mostrando los resultados deterministas.
 */

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const STATIC_SITE_MESSAGE =
  "La IA no está activada en este navegador. Haga clic en 'Configurar API Key' para ingresar su clave gratuita de Google Gemini y activarla.";

function unavailable(reason: AiUnavailableReason, message?: string): AiOutcome<never> {
  return { available: false, reason, message: message ?? AI_UNAVAILABLE_MESSAGES[reason] };
}

async function post<T>(url: string, body: unknown, fetchImpl: FetchLike): Promise<AiOutcome<T>> {
  // Versión publicada como sitio estático (GitHub Pages): no existe servidor ni rutas /api.
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") {
    return unavailable("not_configured", STATIC_SITE_MESSAGE);
  }
  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return unavailable("error", "No se pudo contactar al servidor. Configure su propia clave de API en el navegador si desea usar la IA.");
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return unavailable("error");
  }
  const data = json as Partial<AiOutcome<T>> & { error?: string; details?: string[] };

  if (res.status === 429) return unavailable("rate_limited");
  if (!res.ok) {
    return unavailable("error", data.error ? `${data.error}` : undefined);
  }
  if (data.available === true && "data" in data && data.data !== undefined) {
    return { available: true, data: data.data as T, model: String((data as { model?: string }).model ?? "") };
  }
  if (data.available === false && typeof data.reason === "string") {
    const reason = data.reason in AI_UNAVAILABLE_MESSAGES ? (data.reason as AiUnavailableReason) : "error";
    return unavailable(reason, typeof data.message === "string" ? data.message : undefined);
  }
  return unavailable("error");
}

export function fetchExplanation(
  entityType: string,
  answers: Record<string, string>,
  fetchImpl: FetchLike = (i, init) => fetch(i, init),
): Promise<AiOutcome<AiExplanation>> {
  const userKey = getUserApiKey();
  if (userKey) {
    return directGenerateExplanation(userKey, entityType, answers);
  }
  return post<AiExplanation>("/api/ai/explain", { entityType, answers }, fetchImpl);
}

export function fetchConcept(
  concept: string,
  entityType: string | undefined,
  fetchImpl: FetchLike = (i, init) => fetch(i, init),
): Promise<AiOutcome<AiConcept>> {
  const userKey = getUserApiKey();
  if (userKey) {
    return directExplainConcept(userKey, concept, entityType);
  }
  return post<AiConcept>("/api/ai/concept", { concept, entityType }, fetchImpl);
}
