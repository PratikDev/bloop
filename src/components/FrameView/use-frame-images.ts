"use client";

import { useEffect, useState } from "react";
import { afterFirstPaint } from "@/lib/after-paint";
import { DATA_PATHS } from "@/lib/data";
import { loadImage } from "@/lib/load-image";

/** The EIC frame images: ocean now, rain once the first paint is done. */
export function useFrameImages(): { sst: HTMLImageElement | null; rain: HTMLImageElement | null } {
  const [sst, setSst] = useState<HTMLImageElement | null>(null);
  const [rain, setRain] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadImage(DATA_PATHS.sstImage)
      .then((img) => !cancelled && setSst(img))
      .catch(() => undefined); // the grid-driven error message covers this
    const cancelRain = afterFirstPaint(() => {
      loadImage(DATA_PATHS.rainImage)
        .then((img) => !cancelled && setRain(img))
        .catch(() => undefined);
    });
    return () => {
      cancelled = true;
      cancelRain();
    };
  }, []);

  return { sst, rain };
}
