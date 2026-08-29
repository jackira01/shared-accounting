export type ProductSuggestion = {
  description: string;
  categoryId: string | null;
  categoryName: string | null;
};

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    const curr = new Array<number>(n + 1);
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

/**
 * Puntúa la similitud entre lo escrito por el usuario y un nombre de producto.
 * Devuelve 0 cuando no hay coincidencia relevante; los valores más altos
 * representan coincidencias más fuertes (exacto > prefijo > contiene > palabra > difusa).
 */
export function similarityScore(query: string, candidate: string): number {
  const q = query.trim().toLowerCase();
  const c = candidate.trim().toLowerCase();
  if (!q || !c) return 0;

  if (c === q) return 3;
  if (c.startsWith(q)) return 2.5;
  if (c.includes(q)) return 2;

  if (c.split(/\s+/).some((word) => word.startsWith(q))) return 1.75;

  const distance = levenshtein(q, c);
  const maxLen = Math.max(q.length, c.length);
  const ratio = 1 - distance / maxLen;
  return ratio >= 0.5 ? ratio : 0;
}

/**
 * Ordena y recorta los productos por similitud con la consulta,
 * devolviendo los `limit` primeros resultados (7 por defecto).
 */
export function rankProducts<T extends { description: string }>(
  query: string,
  items: T[],
  limit = 7
): T[] {
  return items
    .map((item) => ({ item, score: similarityScore(query, item.description) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}
