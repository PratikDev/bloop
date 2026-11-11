"use client";

import { useEffect, useRef } from "react";

export function ClassCanvas({ width, height, codes, swatches, nodata }: { width: number; height: number; codes: Uint8Array; swatches: readonly (readonly number[])[]; nodata: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(width, height);
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      const rgb = code === nodata ? undefined : swatches[code - 1];
      if (!rgb) continue;
      img.data.set([rgb[0], rgb[1], rgb[2], 255], i * 4);
    }
    ctx.putImageData(img, 0, 0);
  }, [width, height, codes, swatches, nodata]);
  return <canvas ref={ref} width={width} height={height} aria-hidden="true" className="absolute inset-0 size-full [image-rendering:pixelated]" />;
}
