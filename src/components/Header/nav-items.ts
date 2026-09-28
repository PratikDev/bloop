import type { MessageKey } from "@/lib/i18n";
import { PAGE_PATHS, type PagePath } from "@/router/modes";

export interface NavItem {
  to: Exclude<PagePath, "/">;
  label: MessageKey;
  /** For narrow screens, when the full label doesn't fit. */
  short: MessageKey;
  /** One line on Home: what the page shows. */
  blurb: MessageKey;
}

/** The three places, in dial order. The page title and the header both read this list. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: PAGE_PATHS.listen, label: "nav.listen", short: "nav.listen", blurb: "home.station.listen" },
  { to: PAGE_PATHS.thenNow, label: "nav.thenNow", short: "nav.thenNow", blurb: "home.station.thenNow" },
  { to: PAGE_PATHS.how, label: "nav.how", short: "nav.howShort", blurb: "home.station.how" },
];
