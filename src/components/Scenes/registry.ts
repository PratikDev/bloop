// The scenes on the Turntable's records carousel (below the live records).
// Each opens with the record swap and returns to the turntable on Esc.

import type { TurntableKey } from "../Turntable/strings-bn";

export const SCENE_IDS = ["ghost", "delta", "terrain", "tunnel"] as const;
export type SceneId = (typeof SCENE_IDS)[number];

export const SCENE_SLEEVES = {
  ghost: "scenes.ghost.sleeve",
  delta: "scenes.delta.sleeve",
  terrain: "scenes.terrain.sleeve",
  tunnel: "scenes.tunnel.sleeve",
} as const satisfies Record<SceneId, TurntableKey>;

/** The mapping.json voices each scene plays (its own sound, plus the live track it sets with useSceneTrack); the credits
 * read these to name the data a scene plays (src/lib/credits). */
export const SCENE_VOICES = {
  ghost: ["heat", "monsoon", "water"],
  delta: ["rain", "snow", "water"],
  terrain: ["ocean", "rain", "snow", "normalTone", "clarity"],
  tunnel: ["heat", "monsoon"],
} as const satisfies Record<SceneId, readonly string[]>;

/** Sleeve art: a still from the scene's own render (captured from the production build). */
export const sceneCover = (id: SceneId) => `/textures/scenes/cover-${id}.webp`;
