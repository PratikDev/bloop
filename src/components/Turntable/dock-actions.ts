import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** A view that opens inside the More popover. */
export type DockView = "speed" | "records" | "bookmarks";

/** One control in the Turntable's bar. One list, so the shared mini player can take them over later. */
export interface DockAction {
  id: string;
  icon: LucideIcon;
  /** The accessible name. */
  label: string;
  /** Shorter visible text, when the name is long. */
  short?: string;
  keys?: string;
  pressed?: boolean;
  /** The bar's one coral action. */
  primary?: boolean;
  /** On the bar itself, or inside More. */
  place: "key" | "more";
  onClick?: () => void;
  /** Inside More: opens this view instead of running `onClick`. */
  view?: DockView;
  /** On the bar: this key opens a popover with this content. */
  popover?: ReactNode;
}
