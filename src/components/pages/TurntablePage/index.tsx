"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useRecordedTexture } from "@/hooks/use-recorded-texture";
import { PAGE_PATHS } from "@/router/modes";
import { useT } from "../../AppState/use-app-state";
import { supportsWebGL } from "../../Globe/use-globe";
import { Turntable } from "../../Turntable";

/**
 * The Turntable: the live Earth on a disc, its scenes, its own dock and drawers. It plays on the Jukebox engine
 * (src/lib/audio-engines.ts), whose live voices carry the "recorded" texture when a track's data is stale (guardrail 16).
 */
export function TurntablePage() {
  const t = useT();
  useRecordedTexture();
  const [webgl] = useState(supportsWebGL);
  return (
    // A grid stretches the Turntable to the page: the screen below the header.
    <div className="relative grid h-full min-h-0 grid-rows-[minmax(0,1fr)]">
      <h1 data-page-title tabIndex={-1} className="sr-only">
        {t("nav.turntable")}
      </h1>
      {webgl ? (
        <Turntable />
      ) : (
        <div data-space className="grid place-items-center bg-space p-6">
          <div className="on-space max-w-md space-y-4 rounded-sheet p-6">
            <p className="text-lead">{t("turntable.noWebgl")}</p>
            <Link to={PAGE_PATHS.listen} className="key inline-flex h-11 items-center rounded-lg bg-paper px-4 text-body text-moon">
              {t("turntable.noWebglLink")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
