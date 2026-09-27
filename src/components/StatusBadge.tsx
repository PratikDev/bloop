import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeKind = "pending" | "interim" | "october" | "error" | "loading";

/** Status is shape + words, never colour: colour means data here (design-plan §2). */
const GLYPHS: Record<BadgeKind, ReactNode> = {
  pending: null, // the dashed outline is its shape
  interim: <path d="M1 6c1.5-4 3-4 4.5 0S8.5 10 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" />,
  october: <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />,
  error: <path d="M2 2h8v5l-3 3H2z" fill="none" stroke="currentColor" strokeWidth="1.5" />,
  loading: <path d="M6 2a4 4 0 1 1-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />,
};

export function StatusBadge({ kind, children, className }: { kind: BadgeKind; children: ReactNode; className?: string }) {
  const glyph = GLYPHS[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-small text-moon",
        kind === "pending" ? "border border-dashed border-line" : "bg-scrim",
        className,
      )}
    >
      {glyph && (
        <svg viewBox="0 0 12 12" className="size-3 shrink-0" aria-hidden="true">
          {glyph}
        </svg>
      )}
      {children}
    </span>
  );
}
