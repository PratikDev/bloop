"use client";

import { useRef } from "react";
import { useWordmarkWidth } from "@/hooks/use-wordmark-width";
import { useT } from "./AppState/use-app-state";

/** The name as a comic sound word: the intro and the 404 page only. Drawn only: both screens already name themselves. */
export function ComicWordmark() {
  const t = useT();
  const ref = useRef<HTMLSpanElement>(null);
  useWordmarkWidth(ref, true);
  return (
    <span ref={ref} aria-hidden="true" translate="no" className="comic-box inline-block -rotate-3 rounded-caption px-3 py-1 font-wide text-title leading-tight">
      {t("app.title")}
    </span>
  );
}
