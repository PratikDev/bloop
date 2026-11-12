"use client";

import { useEffect, useState } from "react";
import { onCaption, type CaptionEvent } from "@/lib/ui-captions";

const KEEP = 3;
const sameLine = (a: CaptionEvent, b: CaptionEvent) => a.key === b.key && JSON.stringify(a.params) === JSON.stringify(b.params);

/** The last few captions the engine emitted, newest last, whether or not the sheet is open. A repeat of the newest isn't added. */
export function useCaptionLines(): CaptionEvent[] {
  const [lines, setLines] = useState<CaptionEvent[]>([]);
  useEffect(
    () =>
      onCaption((caption) => {
        setLines((now) => {
          const newest = now[now.length - 1];
          return newest && sameLine(newest, caption) ? now : [...now, caption].slice(-KEEP);
        });
      }),
    [],
  );
  return lines;
}
