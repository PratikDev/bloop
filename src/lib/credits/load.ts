// The credits as the app shows them: the shipped registry and indexes, built once per page (build.ts).

import { loadFreshness, loadOfficialIndex, loadRelatedIndex } from "@/lib/data";
import { buildCredits } from "./build";
import type { CreditsList } from "./types";

let cached: Promise<CreditsList> | null = null;

export function loadCredits(): Promise<CreditsList> {
  cached ??= Promise.all([loadFreshness(), loadOfficialIndex(), loadRelatedIndex()]).then(([freshness, official, related]) =>
    buildCredits({ freshness, official, related }),
  );
  cached.catch(() => {
    cached = null; // a failed load can be retried
  });
  return cached;
}
