"use client";

import { FLAGS } from "@/lib/flags";
import { useForcedColors } from "@/hooks/use-media-query";
import { useAppState, useT } from "./AppState/use-app-state";

/**
 * Whether the 3D views are hidden (Settings → Hide 3D views). The scenes keep running
 * underneath (the Turntable's needle reads its value from its scene), so only the drawing goes: every task works from
 * the HTML around them, as the spec asks.
 */
export function useHide3d(): boolean {
  const { state } = useAppState();
  const forced = useForcedColors();
  // Low-vision mode: calm view hides them too, and a Windows contrast theme falls back to the 2D views.
  return FLAGS.mapKeys && (state.hide3d || (FLAGS.lowVision && (state.lowVision.calm || forced)));
}

/** Said in place of a hidden 3D view, so a sighted user knows why it is blank and where to bring it back. */
export function Hidden3DNote() {
  const t = useT();
  return (
    <p
      data-testid="hidden-3d-note"
      className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-body text-haze"
    >
      {t("access.hide3d.note")}
    </p>
  );
}
