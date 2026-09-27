"use client";

import { useEffect, useState } from "react";
import { afterFirstPaint } from "@/lib/after-paint";
import { DATA_PATHS } from "@/lib/data";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Couldn't load ${src}`));
    img.src = src;
  });
}

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
