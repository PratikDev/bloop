// three.js render layers. The main pass draws the lit scene (layer 0). Data,
// orientation lines and needle effects are drawn into a separate overlay
// target (OVERLAY) and composited after tone mapping, so their colours are
// never changed by the realism layers; OCCLUDER objects (the globe, the arm)
// are drawn depth-only first so the overlay is hidden behind them.

import type { Object3D } from "three";

export const LAYER = { main: 0, overlay: 1, occluder: 2 } as const;

/** Moves an object and all its children to the overlay pass only. */
export function onOverlay(object: Object3D): void {
  object.traverse((o) => o.layers.set(LAYER.overlay));
}

/** Also draws an object and its children into the overlay's depth pre-pass. */
export function asOccluder(object: Object3D): void {
  object.traverse((o) => o.layers.enable(LAYER.occluder));
}
