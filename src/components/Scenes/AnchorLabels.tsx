"use client";

import { useEffect, useRef } from "react";

/** Anything that can place a named 3D point on screen (null = not visible). */
export interface AnchorFrame {
  anchor(key: string): { x: number; y: number } | null;
}

export interface AnchorText {
  key: string;
  text: string;
}

/** A scene's own names on 3D objects (the aquifer blocks), in the label style, positioned each frame. Visual only. */
export function AnchorLabels({ subscribe, labels }: { subscribe(fn: (f: AnchorFrame) => void): () => void; labels: readonly AnchorText[] }) {
  const refs = useRef(new Map<string, HTMLSpanElement>());
  useEffect(
    () =>
      subscribe((f) => {
        for (const [key, el] of refs.current) {
          const at = f.anchor(key);
          el.hidden = at === null;
          if (at) el.style.transform = `translate(${Math.round(at.x)}px, ${Math.round(at.y)}px) translate(-50%, -100%)`;
        }
      }),
    [subscribe],
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {labels.map((l) => (
        <span
          key={l.key}
          ref={(el) => {
            if (el) refs.current.set(l.key, el);
            else refs.current.delete(l.key);
          }}
          hidden
          className="globe-label absolute top-0 left-0 font-normal whitespace-nowrap"
        >
          {l.text}
        </span>
      ))}
    </div>
  );
}
