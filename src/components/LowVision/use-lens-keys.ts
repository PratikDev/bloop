"use client";

import { formatInteger } from "@/lib/i18n";
import { nextLensSize } from "@/lib/low-vision/settings";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState, useT } from "../AppState/use-app-state";
import { keepPointOfRegard } from "./use-apply-low-vision";

/** Z (lens on or off) and [ / ] (smaller / larger) on the map, each said in the status region. */
export function useLensKeys() {
  const { state, dispatch } = useAppState();
  const t = useT();
  const announce = useAnnounce();
  const lv = state.lowVision;
  return {
    toggle() {
      dispatch({ type: "setLowVision", patch: { lens: !lv.lens } });
      announce(t(lv.lens ? "lv.lens.off" : "lv.lens.on"));
    },
    resize(dir: 1 | -1) {
      const lensSize = nextLensSize(lv.lensSize, dir);
      dispatch({ type: "setLowVision", patch: { lensSize, lens: true } });
      announce(t("lv.lens.size", { px: formatInteger(lensSize, state.lang) }));
      requestAnimationFrame(keepPointOfRegard);
    },
  };
}
