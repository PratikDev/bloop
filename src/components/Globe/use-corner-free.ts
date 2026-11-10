"use client";

import { useEffect, useState, type RefObject } from "react";
import { cornerFree } from "./corner";

/** Whether the stage's corner holds the Pause motion key clear of the disc; measured on the stage, so it never flips back and forth. */
export function useCornerFree(stageRef: RefObject<HTMLElement | null>): boolean {
  const [free, setFree] = useState(true);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const check = () => setFree(cornerFree(stage.clientWidth, stage.clientHeight));
    const observer = new ResizeObserver(check);
    observer.observe(stage);
    check();
    return () => observer.disconnect();
  }, [stageRef]);
  return free;
}
