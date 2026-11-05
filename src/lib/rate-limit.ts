/**
 * Limitador de solicitudes en memoria (ventana deslizante) por clave (IP).
 *
 * Es suficiente para el alcance universitario y una sola instancia del
 * servidor. En producción con varias instancias se debería usar un almacén
 * compartido (por ejemplo Redis).
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Segundos hasta que se libere un cupo. */
  retryAfterSeconds: number;
}

export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string): RateLimitResult {
    const t = this.now();
    const windowStart = t - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((ts) => ts > windowStart);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      const retry = Math.ceil((recent[0] + this.windowMs - t) / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, retry) };
    }

    recent.push(t);
    this.hits.set(key, recent);
    this.prune(windowStart);
    return { allowed: true, remaining: this.limit - recent.length, retryAfterSeconds: 0 };
  }

  /** Evita crecimiento ilimitado del mapa. */
  private prune(windowStart: number) {
    if (this.hits.size < 500) return;
    for (const [k, v] of this.hits) {
      if (v.every((ts) => ts <= windowStart)) this.hits.delete(k);
    }
  }
}

/** Obtiene la IP del cliente desde cabeceras de proxy (o "local"). */
export function getClientKey(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "local";
}
