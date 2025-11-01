// cosine similarity + top-k
// /lib/retrieve.ts
import type { SimilarResult } from "./types";

export function cosineSim(a: number[], b: number[]) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

export function topK(
  queryVec: number[],
  index: { id: string; source: string; text: string; embedding: number[] }[],
  k = 5
): SimilarResult[] {
  const scored = index.map((c) => ({
    ...c,
    score: cosineSim(queryVec, c.embedding),
  }));
  scored.sort((x, y) => y.score - x.score);
  return scored
    .slice(0, k)
    .map(({ id, source, text, score }) => ({ id, source, text, score }));
}
