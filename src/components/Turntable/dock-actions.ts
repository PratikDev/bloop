import type { ReactNode } from "react";
import type { DockIcon } from "./DockButton";

/** A view that opens inside the More popover. */
export type DockView = "speed" | "records" | "bookmarks" | "needle" | "mixer";

/** One control in the Turntable's bar. One list, so the shared mini player can take them over later. */
export interface DockAction {
  id: string;
  icon: DockIcon;
  /** The accessible name. */
  label: string;
  /** Shorter visible text, when the name is long. */
  short?: string;
  keys?: string;
  pressed?: boolean;
  /** On the bar itself, or inside More. */
  place: "key" | "more";
  /** On the bar from 768 px, inside More below it (phones keep five controls). */
  phoneMore?: boolean;
  onClick?: () => void;
  /** Inside More: opens this view instead of running `onClick`. */
  view?: DockView;
  /** On the bar: this key opens a popover with this content. */
  popover?: ReactNode;
}
