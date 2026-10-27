"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { SceneId } from "./registry";
import type { SceneProps } from "./types";

// Each scene is its own chunk, loaded only when its record is dropped.
const SCENES: Record<SceneId, ComponentType<SceneProps>> = {
  ghost: dynamic(() => import("./ghost").then((m) => m.GhostEarths), { ssr: false }),
  delta: dynamic(() => import("./delta").then((m) => m.PlayableDelta), { ssr: false }),
  terrain: dynamic(() => import("./terrain").then((m) => m.SoundTerrain), { ssr: false }),
  tunnel: dynamic(() => import("./tunnel").then((m) => m.TimeTunnel), { ssr: false }),
};

/** The open scene over the turntable (unmounted, and so disposed, on exit). */
export function SceneHost({ id, ...props }: SceneProps & { id: SceneId }) {
  const Scene = SCENES[id];
  return <Scene {...props} />;
}
