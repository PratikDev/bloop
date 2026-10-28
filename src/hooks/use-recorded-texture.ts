"use client";

import { useEffect } from "react";
import { audio } from "@/lib/audio-adapter";
import { voiceSpec } from "@/lib/audio/mapping";
import { livenessAt } from "@/lib/data";
import { useFreshness } from "./use-freshness";

const RECHECK_MS = 60_000;
const TRACKS = ["ocean", "rain"] as const;

/**
 * Guardrail 16: a live track whose data is past its freshness limit plays the "recorded" texture.
 * Each track's product is its mapping.json voice's source.product; rechecked every minute.
 */
export function useRecordedTexture(): void {
  const freshness = useFreshness();
  useEffect(() => {
    if (!freshness) return;
    const apply = () => {
      const now = Date.now();
      for (const track of TRACKS) {
        const product = voiceSpec(track).source.product;
        audio.setRecorded(track, product !== undefined && livenessAt(freshness.products[product], now) === "recorded");
      }
    };
    apply();
    const id = window.setInterval(apply, RECHECK_MS);
    return () => window.clearInterval(id);
  }, [freshness]);
}
