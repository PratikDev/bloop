"use client";

import { dotsOf } from "@/a11y/brailleShape";
import { useT } from "../AppState/use-app-state";

/** Dot positions in a cell (column, row), dots 1–8. */
const DOT_XY: Record<number, [number, number]> = { 1: [0, 0], 2: [0, 1], 3: [0, 2], 4: [1, 0], 5: [1, 1], 6: [1, 2], 7: [0, 3], 8: [1, 3] };
const BRAILLE = /[⠀-⣿]/u;

/**
 * For sighted helpers, demos and video: the shape line's cells drawn as dots. The text is already Unicode
 * braille, so nothing is translated; a reader's own screen reader table may still show other text cells.
 */
export function BraillePreview({ text }: { text: string }) {
  const t = useT();
  return (
    <figure aria-hidden="true" className="space-y-2">
      <figcaption className="text-small text-haze">{t("braille.previewNote")}</figcaption>
      <div className="space-y-1 overflow-x-auto">
        {text.split("\n").map((line, r) => (
          <div key={r} className="flex gap-1">
            {[...line].map((ch, i) =>
              BRAILLE.test(ch) ? (
                <svg key={i} viewBox="0 0 2 4" className="h-6 w-3 shrink-0">
                  {Object.entries(DOT_XY).map(([d, [x, y]]) => (
                    <circle key={d} cx={x + 0.5} cy={y + 0.5} r={0.32}
                      className={dotsOf(ch).includes(Number(d)) ? "fill-moon" : "fill-line"} />
                  ))}
                </svg>
              ) : (
                <span key={i} className="text-small text-haze">{ch}</span>
              ),
            )}
          </div>
        ))}
      </div>
    </figure>
  );
}
