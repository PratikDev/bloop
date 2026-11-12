import type { MessageKey } from "@/lib/i18n";
import { PAGE_PATHS, type PagePath } from "@/router/modes";

export interface NavItem {
  to: Exclude<PagePath, "/">;
  label: MessageKey;
  /** For narrow screens, when the full label doesn't fit. */
  short: MessageKey;
}

/** The places in the header, in order. Official records isn't one: it is reached from the rack, How we know and its URL. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: PAGE_PATHS.listen, label: "nav.listen", short: "nav.listen" },
  { to: PAGE_PATHS.thenNow, label: "nav.thenNow", short: "nav.thenNow" },
  { to: PAGE_PATHS.how, label: "nav.how", short: "nav.howShort" },
  { to: PAGE_PATHS.turntable, label: "nav.turntable", short: "nav.turntable" },
];

/** Every titled page: the document title reads this list. */
export const TITLED_PAGES: readonly NavItem[] = [
  ...NAV_ITEMS,
  { to: PAGE_PATHS.official, label: "nav.official", short: "nav.officialShort" },
  { to: PAGE_PATHS.team, label: "nav.team", short: "nav.team" },
];
