import { z } from "zod";
import { getClientKey, type RateLimiter } from "@/lib/rate-limit";
import type { LlmClient } from "./gemini-client";
import {
  AI_UNAVAILABLE_MESSAGES,
  ConceptRequestSchema,
  ExplainRequestSchema,
} from "./schemas";
import { explainConcept, explainResult } from "./service";

/**
 * Lógica de las rutas /api/ai/*. Se separa de los archivos `route.ts` para
 * poder probarla sin levantar el servidor.
 *
 * Convención de respuesta:
 *  - 200 { available: true, data }           IA respondió y pasó las validaciones.
 *  - 200 { available: false, reason, message } IA no disponible (el cliente sigue con
 *                                             los resultados deterministas).
 *  - 400 entrada inválida · 413 cuerpo muy grande · 429 límite de solicitudes.
 */

export const MAX_BODY_BYTES = 20_000;

export interface HandlerDeps {
  /** Se resuelve por solicitud para leer las variables de entorno vigentes. */
  getClient: () => LlmClient | null;
  limiter: RateLimiter;
  timeoutMs?: number;
}

async function readJsonBody(
  request: Request,
): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: Response.json({ error: "El cuerpo de la solicitud es demasiado grande." }, { status: 413 }),
    };
  }
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      response: Response.json({ error: "El cuerpo no es un JSON válido." }, { status: 400 }),
    };
  }
}

function rateLimited(retryAfterSeconds: number): Response {
  return Response.json(
    { available: false, reason: "rate_limited", message: AI_UNAVAILABLE_MESSAGES.rate_limited },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

function invalid(error: z.ZodError): Response {
  return Response.json(
    {
      error: "Datos de entrada inválidos.",
      details: error.issues.map((i) => i.message).slice(0, 5),
    },
    { status: 400 },
  );
}

export async function handleExplain(request: Request, deps: HandlerDeps): Promise<Response> {
  const limit = deps.limiter.check(getClientKey(request.headers));
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = ExplainRequestSchema.safeParse(body.body);
  if (!parsed.success) return invalid(parsed.error);

  const outcome = await explainResult(parsed.data, {
    client: deps.getClient(),
    timeoutMs: deps.timeoutMs,
  });
  return Response.json(outcome);
}

export async function handleConcept(request: Request, deps: HandlerDeps): Promise<Response> {
  const limit = deps.limiter.check(getClientKey(request.headers));
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = ConceptRequestSchema.safeParse(body.body);
  if (!parsed.success) return invalid(parsed.error);

  const outcome = await explainConcept(parsed.data.concept, parsed.data.entityType, {
    client: deps.getClient(),
    timeoutMs: deps.timeoutMs,
  });
  return Response.json(outcome);
}
