"use client";

import { useCallback } from "react";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState, useT } from "../AppState/use-app-state";

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
