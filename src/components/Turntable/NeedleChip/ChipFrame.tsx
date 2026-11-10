"use client";

import { PushPin, PushPinSlash, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTT } from "../i18n";
import type { Rect } from "../LabelLayer";
import type { Details } from "./use-details";

/** Gap between the needle and the chip, so the chip never covers the needle. */
const GAP_PX = 26;
const EDGE_PX = 24;
/** The caption, legend and dock along the bottom: the card stops above them. */
const BOTTOM_RESERVE_PX = 230;
const MIN_CARD_PX = 160;
const MAX_CHIP_PX = 352;
/** Narrower than this, the chip sits under the top row instead of beside the needle (there's no room beside it). */
const NARROW_PX = 640;
const NARROW_TOP_PX = 96;
/** A docked chip's details card, as tall as the view allows without crowding the globe. */
const DOCKED_CARD: CSSProperties & Record<"--card-max", string> = { "--card-max": "45dvh" };

/** Where the needle is on screen this frame (the Turntable's FrameInfo satisfies it). */
export interface ChipFrameInfo {
  width: number;
  height: number;
  needle: { x: number; y: number };
  /** Crosshair visibility: 0 = hidden (the tonearm shows the needle), 1 = shown. */
  blend: number;
}

export interface ChipFrameProps {
  subscribe(fn: (f: ChipFrameInfo) => void): () => void;
  details: Details;
  /** Areas labels must keep clear of, updated here each frame. */
  reserved?: { current: Rect[] };
  /**
   * Set: the chip stays in this element instead of following the needle, and counts as a panel over the scene.
   * null: it's waiting for that element.
   */
  dock?: HTMLElement | null;
  /** Height of the controls along the bottom (the card stops above them). */
  bottomReserve?: number;
  /** Accessible name of the chip button. */
  label: string;
  /** The pill: value · place (null: no reading yet, only the crosshair shows). */
  chip: ReactNode | null;
  /** The card's large value. */
  headline: ReactNode;
  /** The card's rows under the headline. */
  children: ReactNode;
}

/**
 * The needle chip's frame, shared by the Turntable and its scenes: a crosshair
 * on the needle, a pill beside it (left by preference, flipping when there's no
 * room, in the top row on phones) and a details card that opens on hover,
 * focus, I or Enter and closes itself unless pinned or focused.
 */
export function ChipFrame({ subscribe, details, reserved, dock, bottomReserve = BOTTOM_RESERVE_PX, label, chip, headline, children }: ChipFrameProps) {
  const docked = dock !== undefined;
  const { tt } = useTT();
  const crossRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const size = useRef({ w: 0, h: 0, chip: 0 });

  // The box's size from a ResizeObserver: never read in the frame loop (that forces a layout).
  const observe = useCallback((box: HTMLDivElement | null) => {
    boxRef.current = box;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      const b = entry.borderBoxSize[0];
      // The chip's own height: long place names wrap, so it isn't a fixed size.
      size.current = { w: b?.inlineSize ?? 0, h: b?.blockSize ?? 0, chip: box.firstElementChild?.getBoundingClientRect().height ?? 0 };
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
        if (docked) return;
        const box = boxRef.current;
        const { w, h, chip: chipPx } = size.current;
        if (!box || w === 0) {
          if (reserved) reserved.current = [];
          return;
        }
        // Left of the needle by preference (the tonearm comes in from the right); flips when there's no room.
        const narrow = f.width < NARROW_PX;
        const left = f.needle.x - GAP_PX - w >= EDGE_PX;
        const x = narrow ? EDGE_PX : left ? f.needle.x - GAP_PX - w : Math.min(f.width - w - EDGE_PX, f.needle.x + GAP_PX);
        // The chip's middle lines up with the needle; the card grows downward from there,
        // scrolling inside rather than running under the caption, legend and dock.
        const y = narrow ? NARROW_TOP_PX : Math.min(f.height - chipPx - bottomReserve, Math.max(EDGE_PX, f.needle.y - chipPx / 2));
        box.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
        box.style.setProperty("--card-max", `${Math.max(MIN_CARD_PX, Math.round(f.height - bottomReserve - y - chipPx - 8))}px`);
        box.style.maxWidth = `${Math.min(MAX_CHIP_PX, f.width - 2 * EDGE_PX)}px`;
        box.dataset.side = left ? "left" : "right";
        if (reserved) reserved.current = [{ x, y, w, h }];
      }),
    [subscribe, reserved, bottomReserve, docked],
  );

  const box = chip !== null && (
    <div
      ref={observe}
      style={docked ? DOCKED_CARD : undefined}
      className={docked ? "w-full" : "absolute top-0 left-0 z-10"}
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
        data-tt-occluder={docked || undefined}
        aria-expanded={details.open}
        aria-label={label}
        onClick={details.toggle}
        onFocus={details.show}
        className={cn("on-space flex min-h-11 max-w-full flex-wrap items-baseline gap-x-3 rounded-plate px-4 py-1 text-left text-body", docked && "w-full max-sm:border-0 max-sm:bg-transparent max-sm:shadow-none")}
      >
        {chip}
      </button>
      <div
        data-open={details.open}
        data-tt-occluder={(docked && details.open) || undefined}
        inert={!details.open}
        className={cn(
          "on-space mt-2 max-h-(--card-max) origin-top space-y-2 overflow-y-auto rounded-plate p-4 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
          details.open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
          docked && !details.open && "hidden",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          {headline}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-pressed={details.pinned}
              aria-label={tt(details.pinned ? "turntable.details.unpin" : "turntable.details.pin")}
              onClick={() => details.setPinned(!details.pinned)}
              className="size-11"
            >
              {details.pinned ? <PushPinSlash aria-hidden="true" /> : <PushPin aria-hidden="true" />}
            </Button>
            <Button variant="ghost" size="icon" aria-label={tt("turntable.details.close")} onClick={details.hide} className="size-11">
              <X aria-hidden="true" />
            </Button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <>
      <svg ref={crossRef} aria-hidden="true" viewBox="0 0 32 32" className="pointer-events-none absolute top-0 left-0 size-8 text-amber">
        <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        {!docked && <circle cx="16" cy="16" r="1.6" fill="currentColor" />}
      </svg>
      {docked ? box && dock && createPortal(box, dock) : box}
    </>
  );
}
