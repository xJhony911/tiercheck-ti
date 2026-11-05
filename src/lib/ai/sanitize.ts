/**
 * Utilidades de saneamiento para el módulo de IA.
 * Evitan que claves o secretos del usuario lleguen al modelo y detectan
 * afirmaciones que la IA no debe hacer.
 */

const SECRET_PATTERNS: RegExp[] = [
  /AIza[0-9A-Za-z_-]{20,}/, // claves de Google
  /\bsk-[A-Za-z0-9_-]{16,}/, // claves tipo OpenAI
  /\b(ghp|gho|ghu|ghs)_[A-Za-z0-9]{20,}/, // tokens de GitHub
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(password|passwd|contrase[ñn]a|clave|api[_-]?key|secret|token)\s*[:=]\s*\S+/i,
  /\b[A-Za-z0-9+/_-]{40,}={0,2}\b/, // cadenas largas tipo token/base64
];

export function containsSecretPattern(text: string): boolean {
  return SECRET_PATTERNS.some((p) => p.test(text));
}

/** Convierte numerales romanos o arábigos de "Tier X" a número (1-4). */
function tierNumber(raw: string): number | undefined {
  const v = raw.toUpperCase();
  const map: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, "1": 1, "2": 2, "3": 3, "4": 4 };
  return map[v];
}

/** Niveles Tier mencionados explícitamente en un texto ("Tier III", "tier 3"). */
export function mentionedTiers(text: string): number[] {
  const found: number[] = [];
  const re = /\btier\s*(IV|III|II|I|[1-4])\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = tierNumber(m[1]);
    if (n !== undefined) found.push(n);
  }
  return found;
}

/** Afirmaciones prohibidas: cumplimiento o certificación oficial. */
const FORBIDDEN_CLAIMS: RegExp[] = [
  /\best[aá]\s+certificad[oa]\b/i,
  /\bcumple\s+(oficialmente|con la certificaci[oó]n)\b/i,
  /\bcertificaci[oó]n\s+(oficial\s+)?(otorgada|aprobada|obtenida)\b/i,
  /\bhemos\s+certificado\b/i,
  /\bcertificamos\b/i,
  /\bgarantiza(mos)?\s+(el\s+)?cumplimiento\b/i,
  /\bTier\s*(IV|III|II|I|[1-4])\s+(certificad[oa]|oficial)\b/i,
];

export function containsForbiddenClaim(text: string): boolean {
  return FORBIDDEN_CLAIMS.some((p) => p.test(text));
}

/**
 * Verifica que el texto de la IA no contradiga el resultado del motor:
 * no puede mencionar un nivel por encima del siguiente al estimado,
 * ni hacer afirmaciones de certificación.
 *
 * @param estimatedTier nivel estimado por el motor (0 si no hay estimación)
 */
export function isConsistentWithEngine(text: string, estimatedTier: number): boolean {
  if (containsForbiddenClaim(text)) return false;
  const maxAllowed = Math.min(4, estimatedTier + 1);
  return mentionedTiers(text).every((t) => t <= maxAllowed);
}
