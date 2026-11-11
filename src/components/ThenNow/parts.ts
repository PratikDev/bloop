import type { FieldPart } from "./FieldPartView";
import type { Part } from "./use-then-now-player";

export type ViewPart = Part | FieldPart;
const ALL_VIEW_PARTS = ["heat", "monsoon", "water", "fires", "vegetation"] as const satisfies readonly ViewPart[];
export const isFieldPart = (p: ViewPart): p is FieldPart => p === "fires" || p === "vegetation";

const SHOW_FIELD_PARTS = process.env.NEXT_PUBLIC_SHOW_FIELD_PARTS === "1";

const visibleParts = (showField = SHOW_FIELD_PARTS): readonly ViewPart[] => ALL_VIEW_PARTS.filter((p) => showField || !isFieldPart(p));

export const VIEW_PARTS = visibleParts();
