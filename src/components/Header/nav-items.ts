import type { MessageKey } from "@/lib/i18n";
import { PAGE_PATHS, type PagePath } from "@/router/modes";

export interface NavItem {
  to: Exclude<PagePath, "/">;
  label: MessageKey;
  /** For narrow screens, when the full label doesn't fit. */
  short: MessageKey;
  /** One line on Home: what the page shows; a page without one (Team) is not a station there. */
  blurb?: MessageKey;
}

/** The places, in dial order. The page title, the header and Home's stations all read this list. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: PAGE_PATHS.listen, label: "nav.listen", short: "nav.listen", blurb: "home.station.listen" },
  { to: PAGE_PATHS.thenNow, label: "nav.thenNow", short: "nav.thenNow", blurb: "home.station.thenNow" },
  { to: PAGE_PATHS.how, label: "nav.how", short: "nav.howShort", blurb: "home.station.how" },
  { to: PAGE_PATHS.official, label: "nav.official", short: "nav.officialShort", blurb: "home.station.official" },
  { to: PAGE_PATHS.turntable, label: "nav.turntable", short: "nav.turntable", blurb: "home.station.turntable" },
  { to: PAGE_PATHS.team, label: "nav.team", short: "nav.team" },
];

/** Home's stations: the pages that say what they show. */
export const STATIONS = NAV_ITEMS.filter((item): item is NavItem & { blurb: MessageKey } => item.blurb !== undefined);
