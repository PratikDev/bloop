import { cn } from "@/lib/utils";

/** A paper key in a page's control row (Details, Read the check): the same height as the pickers beside it. */
export const ROW_KEY = "key border-navy h-11 gap-2 rounded-lg bg-paper px-4 text-body font-normal text-moon hover:bg-paper";

/** The same key with a long name: it wraps instead of pushing the page sideways. */
export const WRAP_KEY = cn(ROW_KEY, "h-auto min-h-11 max-w-full py-1.5 text-left whitespace-normal aria-expanded:bg-tide");

/** The one coral key of a player: play or stop. */
export const PLAY_KEY = cn(WRAP_KEY, "bg-shapla font-medium hover:bg-shapla");

/** A row of keys: far enough apart that no key sits in its neighbour's shadow. */
export const KEY_ROW = "flex flex-wrap items-center gap-3";
