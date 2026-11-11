export const CREDIT_PAGES = ["listen", "thenNow", "how", "official", "turntable", "braille"] as const;
export type CreditPage = (typeof CREDIT_PAGES)[number];

export const CREDIT_GROUPS = ["observations", "models", "svs"] as const;
export type CreditGroup = (typeof CREDIT_GROUPS)[number];

export interface CreditEntry {
  id: string;
  name: string;
  provider: string;
  link: string | null;
  pages: CreditPage[];
  records: string[];
}

export interface CreditsList {
  data: Record<CreditGroup, CreditEntry[]>;
  testing: CreditEntry[];
}
