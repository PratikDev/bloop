import type { FieldPart } from "./FieldPartView";
import type { Part } from "./use-then-now-player";

/** The sounded parts (L2's Then vs Now), then the records shown without sound yet. */
export type ViewPart = Part | FieldPart;
export const VIEW_PARTS = ["heat", "monsoon", "water", "fires", "vegetation"] as const satisfies readonly ViewPart[];
export const isFieldPart = (p: ViewPart): p is FieldPart => p === "fires" || p === "vegetation";
