"use client";

import { useCallback } from "react";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState, useT } from "../AppState/use-app-state";

/** The low-vision preset: whether it is on, and the switch (said once), shared by the header, Alt+L and Track 0. */
export function useLowVisionPreset(): { on: boolean; toggle: () => void } {
  const { state, dispatch } = useAppState();
  const t = useT();
  const announce = useAnnounce();
  const on = state.lowVision.on;
  const toggle = useCallback(() => {
    dispatch({ type: "lowVisionPreset", on: !on });
    announce(t(on ? "lv.presetOff" : "lv.presetOn"));
  }, [on, dispatch, announce, t]);
  return { on, toggle };
}
