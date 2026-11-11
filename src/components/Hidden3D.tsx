"use client";

import { FLAGS } from "@/lib/flags";
import { useForcedColors } from "@/hooks/use-media-query";
import { useAppState, useT } from "./AppState/use-app-state";

export function useHide3d(): boolean {
  const { state } = useAppState();
  const forced = useForcedColors();
  return FLAGS.mapKeys && (state.hide3d || (FLAGS.lowVision && (state.lowVision.calm || forced)));
}

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
