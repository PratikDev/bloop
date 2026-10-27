"use client";

import { ContactShadows, Environment } from "@react-three/drei";
import { Canvas, events, useFrame, useThree, type RootStore } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { PerspectiveCamera } from "three";
import { readPalette } from "@/lib/css-tokens";
import { resolveTier, type Tier } from "./quality";
import { createTurntableScene, type TurntableScene } from "./scene";

/** Poly Haven studio_small_09 (CC0), stored locally: reflections on the vinyl, metal and glass. */
const STUDIO_HDRI = "/textures/studio/studio_small_09_1k.hdr";
const CAMERA = { fov: 30, near: 0.02, far: 100 } as const;

/** The globe is driven by its own pointer handlers (use-globe-pointer), so R3F's raycasting stays off. */
const noPointerEvents = (store: RootStore) => ({ ...events(store), enabled: false });

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
      gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }}
      camera={CAMERA}
      events={noPointerEvents}
      role="img"
      aria-label={label}
      className="absolute inset-0"
    >
      <Environment files={STUDIO_HDRI} environmentIntensity={0.32} />
      <ContactShadows position={[0.35, -1.545, 0.1]} scale={[6.6, 5.6]} far={1.4} blur={2.8} opacity={0.7} resolution={512} />
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
  const tierRef = useRef(tier);

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const s = createTurntableScene({ renderer: gl, scene, camera, advance }, dataCanvas, readPalette(), resolveTier(tierRef.current, gl.capabilities.maxTextureSize));
    sceneRef.current = s;
    onReady(s);
    return () => {
      onReady(null);
      sceneRef.current = null;
      s.dispose();
    };
  }, [gl, scene, camera, advance, dataCanvas, onReady]);

  useEffect(() => {
    if (tierRef.current === tier) return;
    tierRef.current = tier;
    sceneRef.current?.setTier(resolveTier(tier, gl.capabilities.maxTextureSize));
  }, [tier, gl]);

  useEffect(() => {
    sceneRef.current?.resize(size.width, size.height);
  }, [size]);

  // Priority 1: R3F's own render is off; the post chain draws the frame.
  useFrame((_, dt) => sceneRef.current?.draw(dt), 1);
  return null;
}
