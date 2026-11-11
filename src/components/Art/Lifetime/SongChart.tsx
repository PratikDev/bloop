"use client";

import type { SongPart } from "@/lib/art/lifetime/song";
import { useT } from "../../AppState/use-app-state";

const W = 320;
const H = 64;

/** One part's yearly values as a small line, with the playhead on the year sounding now. The numbers are in the text
 *  beside it (and the sheet); the picture is a figure with a short name. */
export function SongChart({ part, year }: { part: SongPart; year: number | null }) {
  const t = useT();
  const xs = part.notes.map((n) => n.year);
  const [lo, hi] = part.range;
  const x = (y: number) => ((y - xs[0]) / Math.max(1, xs[xs.length - 1] - xs[0])) * (W - 8) + 4;
  const y = (v: number) => H - 4 - ((v - lo) / Math.max(1e-9, hi - lo)) * (H - 8);
  const d = part.notes.map((n, i) => `${i ? "L" : "M"}${x(n.year).toFixed(1)},${y(n.value).toFixed(1)}`).join(" ");
  return (
    <figure className="space-y-1" data-part={part.part}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("lifetime.chart", { part: t(`lifetime.part.${part.part}`) })} className="h-16 w-full max-w-md text-moon">
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" />
        {year !== null && year >= xs[0] && year <= xs[xs.length - 1] && (
          <rect data-testid="playhead" data-year={year} x={x(year) - 1} width={2} y={0} height={H} fill="currentColor" opacity={0.8} />
        )}
      </svg>
      <figcaption className="text-small text-haze">{t(`lifetime.part.${part.part}`)}</figcaption>
    </figure>
  );
}
