"use client";

import { Pin, PinOff, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { rainText } from "@/lib/reading";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../../AppState/use-app-state";
import { useLiveData } from "../../LiveData/use-live-data";
import { Figure, hero } from "../../Readout";
import { useShownPoint } from "../../TimeLapse/use-shown-point";
import { FrameFacts } from "../FrameFacts";
import { En, useTT } from "../i18n";
import type { Rect } from "../LabelLayer";
import { recordFrames } from "../records";
import type { Turntable } from "../use-turntable";
import type { Details } from "./use-details";

/** Gap between the needle and the chip, so the chip never covers the needle. */
const GAP_PX = 26;
const EDGE_PX = 12;
const CHIP_PX = 44;
/** The caption, legend and dock along the bottom: the card stops above them. */
const BOTTOM_RESERVE_PX = 230;
const MIN_CARD_PX = 160;
/** Narrower than this, the chip sits under the top row instead of beside the needle (there's no room beside it). */
const NARROW_PX = 640;
const NARROW_TOP_PX = 96;

interface Props {
  subscribe: Turntable["subscribe"];
  /** Full place line ("Bay of Bengal", "341 km SE of Bhubaneswar, India"). */
  place: string | null;
  details: Details;
  /** Areas labels must keep clear of, updated here each frame. */
  reserved: { current: Rect[] };
}

/**
 * The value under the needle as a small pill beside it (flipping sides so it
 * never covers the needle), expanding into a details card on hover, focus, I
 * or Enter. The card closes itself after 4 s unless pinned or focused. The
 * same reading is spoken on Enter and on arrival (live region).
 */
export function NeedleChip({ subscribe, place, details, reserved }: Props) {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const t = useT();
  const { tt, lang } = useTT();
  const { reading: r, cursor, track } = useShownPoint();
  const crossRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const size = useRef({ w: 0, h: 0 });
  const [now] = useState(Date.now);

  // The box's size from a ResizeObserver: never read in the frame loop (that forces a layout).
  const observe = useCallback((box: HTMLDivElement | null) => {
    boxRef.current = box;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      const b = entry.borderBoxSize[0];
      size.current = { w: b?.inlineSize ?? 0, h: b?.blockSize ?? 0 };
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () =>
      subscribe((f) => {
        const cross = crossRef.current;
        if (cross) {
          cross.style.transform = `translate(${Math.round(f.needle.x - 16)}px, ${Math.round(f.needle.y - 16)}px)`;
          cross.style.opacity = String(Math.max(0, (f.blend - 0.4) / 0.6));
        }
        const box = boxRef.current;
        const { w, h } = size.current;
        if (!box || w === 0) {
          reserved.current = [];
          return;
        }
        // Left of the needle by preference (the tonearm comes in from the right); flips when there's no room.
        const narrow = f.width < NARROW_PX;
        const left = f.needle.x - GAP_PX - w >= EDGE_PX;
        const x = narrow ? EDGE_PX : left ? f.needle.x - GAP_PX - w : Math.min(f.width - w - EDGE_PX, f.needle.x + GAP_PX);
        // The chip's middle lines up with the needle; the card grows downward from there,
        // scrolling inside rather than running under the caption, legend and dock.
        const y = narrow ? NARROW_TOP_PX : Math.min(f.height - CHIP_PX - BOTTOM_RESERVE_PX, Math.max(EDGE_PX, f.needle.y - CHIP_PX / 2));
        box.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
        box.style.setProperty("--card-max", `${Math.max(MIN_CARD_PX, Math.round(f.height - BOTTOM_RESERVE_PX - y - CHIP_PX - 8))}px`);
        box.dataset.side = left ? "left" : "right";
        reserved.current = [{ x, y, w, h }];
      }),
    [subscribe, reserved],
  );

  const main = r ? hero(r, track, state.lang) : null;
  const bn = lang === "bn";
  const fallback = r && (track === "rain" ? rainText(t, r.rain, r.rainLoaded) : t("reading.oceanNone"));

  return (
    <>
      <svg ref={crossRef} aria-hidden="true" viewBox="0 0 32 32" className="pointer-events-none absolute top-0 left-0 size-8 text-amber">
        <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="16" r="1.6" fill="currentColor" />
      </svg>
      {r && (
        <div
          ref={observe}
          className="absolute top-0 left-0 max-w-[min(22rem,calc(100%-1.5rem))]"
          onPointerEnter={() => {
            details.show();
            details.hold(true);
          }}
          onPointerLeave={() => details.hold(false)}
          onFocus={() => details.hold(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) details.hold(false);
          }}
        >
          <button
            type="button"
            aria-expanded={details.open}
            aria-label={tt("turntable.details.open")}
            onClick={details.toggle}
            onFocus={details.show}
            className="glass-chip flex h-11 max-w-full items-center gap-2 rounded-full px-4 text-left text-body"
          >
            <span className="shrink-0 font-display text-lead font-semibold whitespace-nowrap tabular-nums text-moon">
              {main ? (
                <>
                  <Figure text={main.figure} lang={state.lang} /> {t(main.unit)}
                </>
              ) : (
                <En active={bn}>{fallback}</En>
              )}
            </span>
            {place && <span className="min-w-0 truncate text-haze">· {place}</span>}
          </button>
          <div
            data-open={details.open}
            inert={!details.open}
            className={cn(
              "glass-card mt-2 max-h-(--card-max) origin-top space-y-2 overflow-y-auto rounded-2xl p-4 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
              details.open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-value leading-none font-semibold tabular-nums text-moon">
                {main ? (
                  <>
                    <Figure text={main.figure} lang={state.lang} />
                    <span className="text-lead font-medium">{" " + t(main.unit)}</span>
                  </>
                ) : (
                  <span className="text-title">
                    <En active={bn}>{fallback}</En>
                  </span>
                )}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-pressed={details.pinned}
                  aria-label={tt(details.pinned ? "turntable.details.unpin" : "turntable.details.pin")}
                  onClick={() => details.setPinned(!details.pinned)}
                  className="size-11"
                >
                  {details.pinned ? <PinOff aria-hidden="true" /> : <Pin aria-hidden="true" />}
                </Button>
                <Button variant="ghost" size="icon" aria-label={tt("turntable.details.close")} onClick={details.hide} className="size-11">
                  <X aria-hidden="true" />
                </Button>
              </div>
            </div>
            {track === "both" && (
              <p className="text-body font-medium text-moon">
                <En active={bn}>{rainText(t, r.rain, r.rainLoaded)}</En>
              </p>
            )}
            {place && <p className="text-body font-medium text-moon">{place}</p>}
            <p className="text-body text-haze">
              <En active={bn}>{t("place.latlon", cursor)}</En>
            </p>
            <div className="space-y-2 border-t border-line pt-2">
              {recordFrames(track, fields).map((f) => (
                <FrameFacts key={f.product} frame={f} now={now} tt={tt} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
