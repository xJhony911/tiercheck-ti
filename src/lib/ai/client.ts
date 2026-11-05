import {
  AI_UNAVAILABLE_MESSAGES,
  type AiConcept,
  type AiExplanation,
  type AiOutcome,
  type AiUnavailableReason,
} from "./schemas";

/**
 * Cliente del navegador para las rutas /api/ai/*.
 * Nunca lanza: cualquier fallo se convierte en { available: false } para que la
 * interfaz siga mostrando los resultados deterministas.
 */

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const STATIC_SITE_MESSAGE =
  "La personalización con IA no está disponible en esta versión publicada (sitio estático, sin servidor). Para usarla, ejecute el proyecto localmente o en un servidor con GEMINI_API_KEY configurada.";

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
    return unavailable("error", "No se pudo contactar al servidor. La personalización con IA no está disponible.");
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
    return unavailable("error", data.error ? `${data.error} La personalización con IA no está disponible.` : undefined);
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
  return post<AiExplanation>("/api/ai/explain", { entityType, answers }, fetchImpl);
}

export function fetchConcept(
  concept: string,
  entityType: string | undefined,
  fetchImpl: FetchLike = (i, init) => fetch(i, init),
): Promise<AiOutcome<AiConcept>> {
  return post<AiConcept>("/api/ai/concept", { concept, entityType }, fetchImpl);
}
