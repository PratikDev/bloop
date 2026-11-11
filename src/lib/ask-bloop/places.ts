import { normalize, type SearchEntry } from "@/lib/geo/search";

const PLACE_ALIASES: Readonly<Record<string, string>> = {
  chittagong: "Chattogram",
  chittagang: "Chattogram",
  chatgaon: "Chattogram",
  dacca: "Dhaka",
  calcutta: "Kolkata",
  bombay: "Mumbai",
  madras: "Chennai",
  rangoon: "Yangon",
  cumilla: "Comilla",
  "the bay": "Bay of Bengal",
  "bay of bangal": "Bay of Bengal",
  "cox bazar": "Cox's Bazar",
  "coxs bazar": "Cox's Bazar",
};

const BN_ENDINGS = [...new Set(["য়ের", "েতে", "তে", "ের", "য়", "ে", "র"].map((e) => e.normalize("NFKD")))].sort((a, b) => b.length - a.length);

type PlaceMatch = { kind: "one"; place: SearchEntry } | { kind: "ambiguous"; options: SearchEntry[] } | { kind: "none" };

const CLEAR_LEAD = 1.5;
const CANDIDATES = 5;

type Search = (query: string, limit?: number) => SearchEntry[];

function placeQueries(said: string): string[] {
  const q = normalize(said);
  const out = [q];
  const alias = PLACE_ALIASES[q];
  if (alias) out.unshift(normalize(alias));
  for (const end of BN_ENDINGS) if (q.endsWith(end) && q.length > end.length + 1) out.push(q.slice(0, -end.length));
  return [...new Set(out.filter(Boolean))];
}

export function resolvePlace(said: string, search: Search): PlaceMatch {
  for (const q of placeQueries(said)) {
    const found = search(q, CANDIDATES);
    if (!found.length) continue;
    const exact = found.filter((e) => normalize(e.name) === q || (e.nameBn !== null && normalize(e.nameBn) === q));
    if (exact.length === 1) return { kind: "one", place: exact[0] };
    const pool = exact.length ? exact : found;
    const distinct = pool.filter((e, i) => pool.findIndex((o) => normalize(o.name) === normalize(e.name)) === i);
    if (distinct.length === 1 || distinct[0].weight >= CLEAR_LEAD * distinct[1].weight) return { kind: "one", place: distinct[0] };
    return { kind: "ambiguous", options: distinct.slice(0, 3) };
  }
  return { kind: "none" };
}
