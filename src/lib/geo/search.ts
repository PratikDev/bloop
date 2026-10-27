// Offline place search in English and Bangla: exact, prefix, word-prefix,
// substring, then small typos. No geocoding service, no keys.

export type SearchKind = "story" | "country" | "city" | "district" | "sea";
export type ZoomLevel = "country" | "region" | "local";

export interface SearchEntry {
  kind: SearchKind;
  name: string;
  nameBn: string | null;
  lat: number;
  lon: number;
  zoom: ZoomLevel;
  weight: number; // tie-break: more important first
}

/** Lower case, no accents or apostrophes, words separated by single spaces. Bangla vowel signs are kept. */
export function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’`.]/g, "")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim();
}

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** How well `q` matches one normalized name: 0 = not at all. */
function matchScore(q: string, name: string): number {
  if (!name) return 0;
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  const words = name.split(" ");
  if (words.some((w) => w.startsWith(q))) return 60;
  if (name.includes(q)) return 40;
  const allowed = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0;
  if (allowed && words.some((w) => editDistance(q, w.slice(0, q.length + allowed), allowed) <= allowed)) return 20;
  return 0;
}

export interface SearchIndex {
  search(query: string, limit?: number): SearchEntry[];
}

export function createSearchIndex(entries: SearchEntry[]): SearchIndex {
  const prepared = entries.map((e) => ({ e, en: normalize(e.name), bn: e.nameBn ? normalize(e.nameBn) : "" }));
  return {
    search(query, limit = 8) {
      const q = normalize(query);
      if (!q) return [];
      return prepared
        .map(({ e, en, bn }) => ({ e, score: Math.max(matchScore(q, en), matchScore(q, bn)) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score || b.e.weight - a.e.weight)
        .slice(0, limit)
        .map((r) => r.e);
    },
  };
}
