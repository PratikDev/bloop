// The post chain (pmndrs postprocessing):
//   main render → [tone mapping, Scenes only] → overlay composite (data, lines, needle effects, sky) → SMAA.
// The overlay goes on last, so the theme's colours and the colormap's hue are never changed.

import { Effect, EffectComposer, EffectPass, RenderPass, SMAAEffect, SMAAPreset, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import {
  HalfFloatType,
  MeshBasicMaterial,
  Uniform,
  Vector2,
  WebGLRenderTarget,
  type PerspectiveCamera,
  type Scene,
  type Texture,
  type WebGLRenderer,
} from "three";
import { LAYER } from "./layers";

const OVERLAY_FRAGMENT = /* glsl */ `
uniform sampler2D overlay;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 o = texture2D(overlay, uv); // premultiplied
  outputColor = vec4(o.rgb + inputColor.rgb * (1.0 - o.a), o.a + inputColor.a * (1.0 - o.a));
}`;

/** Lays the overlay target (premultiplied) over the main image. */
class OverlayCompositeEffect extends Effect {
  constructor(overlay: Texture) {
    super("OverlayCompositeEffect", OVERLAY_FRAGMENT, { uniforms: new Map([["overlay", new Uniform(overlay)]]) });
  }
}

export interface Post {
  setSize(width: number, height: number): void;
  render(dt: number): void;
  dispose(): void;
}

export interface PostOptions {
  /** AgX on the main image: the Scenes' lit relief needs it; the flat Turntable doesn't. */
  toneMapping?: boolean;
}

export function createPost(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, opts: PostOptions = {}): Post {
  const composer = new EffectComposer(renderer, { frameBufferType: HalfFloatType });
  const overlayTarget = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
  const depthOnly = new MeshBasicMaterial({ colorWrite: false });
  const overlay = new OverlayCompositeEffect(overlayTarget.texture);

  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(opts.toneMapping ? new EffectPass(camera, new ToneMappingEffect({ mode: ToneMappingMode.AGX }), overlay) : new EffectPass(camera, overlay));
  composer.addPass(new EffectPass(camera, new SMAAEffect({ preset: SMAAPreset.HIGH })));

  const size = new Vector2();

  /** Overlay pass: occluders depth-only, then the overlay layer, into the overlay target. */
  const renderOverlay = () => {
    const mask = camera.layers.mask;
    const autoClear = renderer.autoClear;
    const background = scene.background;
    renderer.autoClear = false;
    scene.background = null;
    renderer.setRenderTarget(overlayTarget);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, true, false);
    scene.overrideMaterial = depthOnly;
    camera.layers.set(LAYER.occluder);
    renderer.render(scene, camera);
    scene.overrideMaterial = null;
    camera.layers.set(LAYER.overlay);
    renderer.render(scene, camera);
    camera.layers.mask = mask;
    scene.background = background;
    renderer.autoClear = autoClear;
    renderer.setRenderTarget(null);
  };

  return {
    setSize(width, height) {
      composer.setSize(width, height, false);
      renderer.getDrawingBufferSize(size);
      overlayTarget.setSize(size.x, size.y);
    },
    render(dt) {
      renderOverlay();
      composer.render(dt);
    },
    dispose() {
      composer.dispose();
      overlayTarget.dispose();
      depthOnly.dispose();
    },
  };
}
