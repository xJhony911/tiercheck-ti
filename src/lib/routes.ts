/** Ruta de resultados de una evaluación (se usa el parámetro `id` para ser compatible con exportación estática). */
export function resultsHref(id: string): string {
  return `/resultados?id=${encodeURIComponent(id)}`;
}
