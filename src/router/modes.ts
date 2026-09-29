import type { Mode } from "@/components/AppState/reducer";
import type { ListenSearch } from "./search";

/** The app's pages. Story is the tour on the Listen page, not a page of its own. */
export const PAGE_PATHS = { home: "/", listen: "/listen", thenNow: "/then-now", how: "/how" } as const;
export type PagePath = (typeof PAGE_PATHS)[keyof typeof PAGE_PATHS];

/** The URL is the one source of the mode: the reducer copies it (use-route-sync.ts). */
export function modeFromLocation(pathname: string, search: ListenSearch): Mode {
  switch (pathname) {
    case PAGE_PATHS.listen:
      return search.tour ? "story" : "explore";
    case PAGE_PATHS.thenNow:
      return "thenNow";
    case PAGE_PATHS.how:
      return "how";
    default:
      return "home";
  }
}

/** Where a mode lives: its page, and for Story the tour flag. */
export function locationForMode(mode: Mode): { to: PagePath; search?: ListenSearch } {
  switch (mode) {
    case "explore":
      return { to: PAGE_PATHS.listen, search: {} };
    case "story":
      return { to: PAGE_PATHS.listen, search: { tour: true } };
    case "thenNow":
      return { to: PAGE_PATHS.thenNow };
    case "how":
      return { to: PAGE_PATHS.how };
    case "home":
      return { to: PAGE_PATHS.home };
  }
}
