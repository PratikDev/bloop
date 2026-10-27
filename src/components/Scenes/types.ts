// What every scene shares: the props the Turntable hands it, and the handle
// its three.js builder returns to the shared canvas.

import type { Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { Palette } from "@/lib/css-tokens";
import type { Tier } from "../Turntable/quality";
import type { Geo } from "../Turntable/use-geo";

export interface SceneProps {
  /** Back to the turntable (Esc, the dock's Back, or the scene's own end). */
  onExit(): void;
  /** The Turntable's quality setting (null = automatic). */
  tier: Tier | null;
  /** The Turntable's place names and overlays (null while loading). */
  geo: Geo | null;
}

export interface SceneBuildHost {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  palette: Palette;
  tier: Tier;
}

export interface SceneHandle {
  /** A globe at radius 1: turns the aerial-perspective pass on (Ghost Earths). */
  globe?: Object3D;
  /** Advance by dt seconds, before the frame is drawn. */
  update(dt: number): void;
  /** Size in CSS pixels. */
  resize?(width: number, height: number): void;
  dispose(): void;
}
