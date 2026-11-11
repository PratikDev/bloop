// A line in both languages at once, for captions: the caption bar renders whichever language is on when it shows,
// so a line built from i18n keys (with place names, numbers) is built for each language up front.

import { bindT, type BoundT } from "@/lib/i18n";

export interface BiText {
  en: string;
  bn: string;
}

export const bi = (line: (t: BoundT) => string): BiText => ({ en: line(bindT("en")), bn: line(bindT("bn")) });
