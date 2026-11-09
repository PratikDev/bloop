"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { resolveTier, TIER_SPEC, type Tier } from "./quality";

/** Draws the R3F canvas at the quality tier's sharpness, capped by the device. */
export function useTierDpr(tier: Tier | null): void {
  const gl = useThree((s) => s.gl);
  const setDpr = useThree((s) => s.setDpr);
  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, TIER_SPEC[resolveTier(tier, gl.capabilities.maxTextureSize)].maxDpr));
  }, [tier, gl, setDpr]);
}
