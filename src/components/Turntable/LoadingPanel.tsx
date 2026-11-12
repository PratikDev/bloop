"use client";

import { useRef } from "react";
import { useSpin } from "@/hooks/use-spin";
import { useTT } from "./i18n";

/** Shown until the scene exists: a spinning record and a line of text. */
export function LoadingPanel() {
  const { tt } = useTT();
  const disc = useRef<SVGSVGElement>(null);
  useSpin(disc, true);
  return (
    <div data-tt-occluder className="on-space flex items-center gap-3 rounded-plate px-5 py-3 text-body">
      <svg ref={disc} aria-hidden="true" viewBox="0 0 32 32" className="size-8 shrink-0">
        <circle cx="16" cy="16" r="15" className="fill-navy" />
        <circle cx="16" cy="16" r="10" fill="none" strokeWidth="1" className="stroke-navy-soft" />
        <circle cx="16" cy="16" r="5" className="fill-paper" />
        <circle cx="19" cy="16" r="1" className="fill-navy" />
      </svg>
      {tt("turntable.loading")}
    </div>
  );
}
