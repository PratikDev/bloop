"use client";

import { Environment } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { PerspectiveCamera } from "three";
import { readPalette } from "@/lib/css-tokens";
import { CAMERA, GL_OPTIONS, noPointerEvents, STUDIO_ENV_INTENSITY, STUDIO_HDRI } from "../Turntable/canvas-config";
import { resolveTier, type Tier } from "../Turntable/quality";
import { createPost, type Post } from "../Turntable/scene/post";
import { sceneDebugOn } from "./debug";
import type { SceneBuildHost, SceneHandle } from "./types";

/** The bottom controls cover about a quarter of the view: the 3D centre moves up by this share of the height. */
const VIEW_SHIFT = 0.12;

interface Props<H extends SceneHandle> {
  tier: Tier | null;
  label: string;
  build(host: SceneBuildHost): H;
  onReady(handle: H | null): void;
}

/**
 * A scene's 3D view: Turntable v3's renderer setup (R3F, the studio HDRI, the
 * same post chain and quality tiers). R3F runs the frame loop; the scene's
 * update runs first, then the post chain draws.
 */
export function SceneCanvas<H extends SceneHandle>({ tier, label, build, onReady }: Props<H>) {
  return (
    <Canvas frameloop="always" flat dpr={[1, 2]} gl={GL_OPTIONS} camera={CAMERA} events={noPointerEvents} role="img" aria-label={label} className="absolute inset-0">
      <Environment files={STUDIO_HDRI} environmentIntensity={STUDIO_ENV_INTENSITY} />
      <Bridge tier={tier} build={build} onReady={onReady} />
    </Canvas>
  );
}

function Bridge<H extends SceneHandle>({ tier, build, onReady }: Omit<Props<H>, "label">) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const handleRef = useRef<H | null>(null);
  const postRef = useRef<Post | null>(null);
  const resolved = resolveTier(tier, gl.capabilities.maxTextureSize);
  const buildRef = useRef(build);
  const readyRef = useRef(onReady);
  const fps = useRef({ frames: 0, since: 0, on: sceneDebugOn() });

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const ready = readyRef.current;
    const handle = buildRef.current({ renderer: gl, scene, camera, palette: readPalette(), tier: resolved });
    handleRef.current = handle;
    ready(handle);
    return () => {
      ready(null);
      handleRef.current = null;
      handle.dispose();
    };
    // The tier only changes the post chain (below); the scene is built once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera) || !handleRef.current) return;
    const globe = handleRef.current.globe;
    const post = createPost(gl, scene, camera, resolved, { atmosphere: globe !== undefined });
    if (globe) post.setGlobe(globe);
    post.setSun(null);
    postRef.current = post;
    return () => {
      postRef.current = null;
      post.dispose();
    };
  }, [gl, scene, camera, resolved]);

  useEffect(() => {
    if (camera instanceof PerspectiveCamera && size.height > 0) camera.setViewOffset(size.width, size.height, 0, size.height * VIEW_SHIFT, size.width, size.height);
    postRef.current?.setSize(size.width, size.height);
    handleRef.current?.resize?.(size.width, size.height);
  }, [size, resolved, camera]);

  useFrame((_, dt) => {
    handleRef.current?.update(Math.min(dt, 0.1));
    postRef.current?.render(dt);
    // ?debug=1: frames per second, for the quick checks.
    const f = fps.current;
    if (!f.on) return;
    const now = performance.now();
    f.frames++;
    if (now - f.since >= 1000) {
      window.__sceneFps = (f.frames * 1000) / (now - f.since);
      f.frames = 0;
      f.since = now;
    }
  }, 1);
  return null;
}
