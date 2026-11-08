"use client";

import { FLAGS } from "@/lib/flags";
import { useAppState, useT } from "./AppState/use-app-state";

/**
 * Whether the 3D views are hidden (Settings → Hide 3D views; accessibility core, step 2). The scenes keep running
 * underneath (the Turntable's needle reads its value from its scene), so only the drawing goes: every task works from
 * the HTML around them, as the spec asks.
 */
export function useHide3d(): boolean {
  const { state } = useAppState();
  return FLAGS.mapKeys && state.hide3d;
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
