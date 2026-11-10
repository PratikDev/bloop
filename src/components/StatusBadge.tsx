import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { VinylMark } from "./VinylMark";

export type BadgeKind = "october" | "error" | "loading";

/** Status is shape + words, never colour: colour means data here (design-plan §2). Loading is a spinning record. */
const GLYPHS: Record<Exclude<BadgeKind, "loading">, ReactNode> = {
  october: <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />,
  error: <path d="M2 2h8v5l-3 3H2z" fill="none" stroke="currentColor" strokeWidth="1.5" />,
};

/**
 * A status in words with its shape. Loading (motion item 15) shows a record turning at 33⅓ rpm (still with Reduce
 * motion), and a determinate bar under the words when `progress` (0 to 1) is known.
 */
export function StatusBadge({ kind, children, progress, className }: { kind: BadgeKind; children: ReactNode; progress?: number; className?: string }) {
  return (
    <span className={cn("inline-flex flex-col gap-1 rounded-full border-2 border-line bg-paper px-2 py-0.5 text-small text-moon", progress !== undefined && "rounded-xl py-1", className)}>
      <span className="inline-flex items-center gap-1.5">
        {kind === "loading" ? (
          <VinylMark className="loading-record size-3.5 shrink-0" />
        ) : (
          <svg viewBox="0 0 12 12" className="size-3 shrink-0" aria-hidden="true">
            {GLYPHS[kind]}
          </svg>
        )}
        {children}
      </span>
      {progress !== undefined && (
        <span aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full border border-navy bg-paper">
          <span style={{ "--progress": Math.min(1, Math.max(0, progress)) } as CSSProperties} className="block h-full origin-left scale-x-(--progress) bg-navy" />
        </span>
      )}
    </span>
  );
}
