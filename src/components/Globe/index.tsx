"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAppState } from "../AppState/use-app-state";
import type { GlobeOptions } from "./controller";
import { supportsWebGL, useGlobe } from "./use-globe";

export type GlobeProps = Omit<GlobeOptions, "reduceMotion"> & {
  /** A value that changes when other data the facing point is read against arrives (reported once). */
  dataKey?: unknown;
  className?: string;
};

/**
 * EIC frames on a globe. Real data, not a stock Earth: the same images the map uses. Decorative for
 * assistive tech; whatever shows it says what it is. Without WebGL, the flat frame instead.
 */
export function Globe({ dataKey, className, ...options }: GlobeProps) {
  const { state } = useAppState();
  const [webgl] = useState(supportsWebGL);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useGlobe(canvasRef, { ...options, images: webgl ? options.images : [], reduceMotion: state.reduceMotion }, dataKey);
  const flat = options.images[0];

  return (
    <div aria-hidden="true" className={cn("relative size-full", className)}>
      {webgl ? (
        <canvas ref={canvasRef} className="size-full cursor-grab touch-pan-y active:cursor-grabbing" />
      ) : (
        // The published frame as it is; next/image adds nothing for this local file.
        // eslint-disable-next-line @next/next/no-img-element
        flat && <img src={flat.src} alt="" className="size-full object-contain" />
      )}
    </div>
  );
}
