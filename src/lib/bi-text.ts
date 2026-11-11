import { bindT, type BoundT } from "@/lib/i18n";

export interface BiText {
  en: string;
  bn: string;
}

export const bi = (line: (t: BoundT) => string): BiText => ({ en: line(bindT("en")), bn: line(bindT("bn")) });
