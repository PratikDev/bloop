"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { PerspectiveCamera } from "three";
import { readPalette } from "@/lib/css-tokens";
import { CAMERA, GL_OPTIONS, noPointerEvents } from "./canvas-config";
import type { Tier } from "./quality";
import { createTurntableScene, type TurntableScene } from "./scene";
import { useTierDpr } from "./use-tier-dpr";

interface Props {
  dataCanvas: HTMLCanvasElement;
  /** The Settings choice (null = automatic). */
  tier: Tier | null;
  label: string;
  onReady(scene: TurntableScene | null): void;
}

/**
 * The 3D view. R3F owns the WebGL renderer, camera and scene; the frame loop
 * stays in use-turntable (frameloop "never"), which calls scene.render() →
 * R3F's advance → this component's frame callback → the post chain.
 */
export function TurntableCanvas({ dataCanvas, tier, label, onReady }: Props) {
  return (
    <Canvas
      frameloop="never"
      flat
      dpr={[1, 2]}
      gl={GL_OPTIONS}
      camera={CAMERA}
      events={noPointerEvents}
      role="img"
      aria-label={label}
      className="absolute inset-0"
    >
      <SceneBridge dataCanvas={dataCanvas} tier={tier} onReady={onReady} />
    </Canvas>
  );
}

function SceneBridge({ dataCanvas, tier, onReady }: Omit<Props, "label">) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const advance = useThree((s) => s.advance);
  const size = useThree((s) => s.size);
  const sceneRef = useRef<TurntableScene | null>(null);
  useTierDpr(tier);

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const s = createTurntableScene({ renderer: gl, scene, camera, advance }, dataCanvas, readPalette());
    sceneRef.current = s;
    onReady(s);
    return () => {
      onReady(null);
      sceneRef.current = null;
      s.dispose();
    };
  }, [gl, scene, camera, advance, dataCanvas, onReady]);

  useEffect(() => {
    sceneRef.current?.resize(size.width, size.height);
  }, [size]);

  // Priority 1: R3F's own render is off; the post chain draws the frame.
  useFrame((_, dt) => sceneRef.current?.draw(dt), 1);
  return null;
}
