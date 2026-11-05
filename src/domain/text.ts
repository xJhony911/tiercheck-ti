/** Pasa a minúscula solo la primera letra (conserva siglas como UPS, TI, N+1). */
export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
