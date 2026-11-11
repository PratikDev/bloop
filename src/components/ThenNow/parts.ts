import type { FieldPart } from "./FieldPartView";
import type { Part } from "./use-then-now-player";

/** The sounded parts (L2's Then vs Now), then the records shown without sound. */
export type ViewPart = Part | FieldPart;
export const ALL_VIEW_PARTS = ["heat", "monsoon", "water", "fires", "vegetation"] as const satisfies readonly ViewPart[];
export const isFieldPart = (p: ViewPart): p is FieldPart => p === "fires" || p === "vegetation";

/**
 * Feature flag: fires and vegetation have no honest then-vs-now comparison yet (fires: one example
 * season per window; vegetation: three years of single 250 m pixels, unvalidated) and no sound, so they are hidden
 * from the tabs and the URL. NEXT_PUBLIC_SHOW_FIELD_PARTS=1 shows them again; their code stays.
 */
export const SHOW_FIELD_PARTS = process.env.NEXT_PUBLIC_SHOW_FIELD_PARTS === "1";

export const visibleParts = (showField = SHOW_FIELD_PARTS): readonly ViewPart[] => ALL_VIEW_PARTS.filter((p) => showField || !isFieldPart(p));

/** The tabs Then vs Now shows (and the parts a URL may name). */
export const VIEW_PARTS = visibleParts();
