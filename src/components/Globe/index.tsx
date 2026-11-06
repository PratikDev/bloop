"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { DATA_PATHS } from "@/lib/data";
import { EASE_OUT_SOFT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useAppState } from "../AppState/use-app-state";
import { useFrameImages } from "../FrameView/use-frame-images";
import { supportsWebGL, useGlobe } from "./use-globe";

/**
 * Today's EIC ocean frame on a turning globe (Home). Real data, not a stock
 * Earth: the same image the map uses. Decorative for assistive tech; the frame
 * label beside it says what it is. Without WebGL, the flat frame instead.
 */
export function Globe({ className }: { className?: string }) {
  const { state } = useAppState();
  const { sst: image } = useFrameImages();
  const [webgl] = useState(supportsWebGL);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useGlobe(canvasRef, webgl ? image : null, state.reduceMotion);

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={image ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
      transition={{ duration: 1.1, ease: EASE_OUT_SOFT }}
      className={cn("relative", webgl ? "aspect-square" : "aspect-[2/1]", className)}
    >
      {webgl ? (
        <canvas ref={canvasRef} className="size-full cursor-grab touch-pan-y active:cursor-grabbing" />
      ) : (
        // The published frame as it is; next/image adds nothing for this local file.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={DATA_PATHS.sstImage} alt="" className="size-full rounded-plate object-cover" />
      )}
    </motion.div>
  );
}
