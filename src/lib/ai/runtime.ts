import "server-only";
import { RateLimiter } from "@/lib/rate-limit";
import { getConfiguredClient } from "./gemini-client";
import type { HandlerDeps } from "./handlers";

/**
 * Dependencias reales de las rutas de IA (solo servidor).
 * Límite: 10 solicitudes por minuto por IP.
 */
export const aiHandlerDeps: HandlerDeps = {
  getClient: () => getConfiguredClient(),
  limiter: new RateLimiter(10, 60_000),
};
