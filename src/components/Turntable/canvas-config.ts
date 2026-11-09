// Shared by every R3F canvas in the Turntable and its scenes.

import { events, type RootStore } from "@react-three/fiber";

/** Poly Haven studio_small_09 (CC0), stored locally: reflections on the vinyl, metal and glass. */
export const STUDIO_HDRI = "/textures/studio/studio_small_09_1k.hdr";
export const STUDIO_ENV_INTENSITY = 0.32;
export const CAMERA = { fov: 30, near: 0.02, far: 100 } as const;
/** Narrower than this, the stage is a phone's: the value chip sits in the top row and the deck moves down to clear it. */
export const NARROW_STAGE_PX = 640;
export const GL_OPTIONS = { antialias: false, stencil: false, powerPreference: "high-performance" } as const;

/** Each view drives its own pointer handlers, so R3F's raycasting stays off. */
export const noPointerEvents = (store: RootStore) => ({ ...events(store), enabled: false });
