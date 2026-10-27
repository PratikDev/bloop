// The post chain (pmndrs postprocessing):
//   main render → [SSAO, Ultra] → atmosphere (takram aerial perspective)
//   → [depth of field, Ultra, Jukebox view] → bloom → AgX → vignette
//   → overlay composite (data, lines, needle effects) → SMAA.
// The overlay is composited after tone mapping so the colormap's hue is never
// changed; bloom only catches HDR emitters (stylus, city lights).

import {
  AerialPerspectiveEffect,
  PrecomputedTexturesLoader,
  type PrecomputedTextures,
} from "@takram/three-atmosphere";
import { Ellipsoid } from "@takram/three-geospatial";
import {
  BloomEffect,
  DepthOfFieldEffect,
  Effect,
  EffectComposer,
  EffectPass,
  NormalPass,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
  SSAOEffect,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from "postprocessing";
import {
  HalfFloatType,
  Matrix4,
  MeshBasicMaterial,
  Uniform,
  Vector2,
  WebGLRenderTarget,
  type Object3D,
  type PerspectiveCamera,
  type Scene,
  type Texture,
  type Vector3,
  type WebGLRenderer,
} from "three";
import { TIER_SPEC, type Tier } from "../quality";
import { LAYER } from "./layers";

/** Our globe has radius 1; the atmosphere model's ground is 6,360 km (Bruneton's Earth). */
const METRES_PER_UNIT = 6_360_000;
const SPHERE = new Ellipsoid(METRES_PER_UNIT, METRES_PER_UNIT, METRES_PER_UNIT);
/**
 * Bruneton's tables, precomputed and pre-scaled to match the Earth shader's sun
 * by scripts/build-atmosphere.mjs (SUN_MATCH lives there), so nothing is
 * computed on the GPU at load.
 */
const ATMOSPHERE_TABLES = "/atmosphere/";
/** Our axes (y north, lon 0° at +z, east +x) → ECEF (x lon 0°, y 90° E, z north), scaled to metres. */
const LOCAL_TO_ECEF = new Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1).multiplyScalar(METRES_PER_UNIT);
LOCAL_TO_ECEF.elements[15] = 1;

const OVERLAY_FRAGMENT = /* glsl */ `
uniform sampler2D overlay;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 o = texture2D(overlay, uv); // premultiplied
  outputColor = vec4(o.rgb + inputColor.rgb * (1.0 - o.a), inputColor.a);
}`;

/** Lays the overlay target (premultiplied) over the tone-mapped image. */
class OverlayCompositeEffect extends Effect {
  constructor(overlay: Texture) {
    super("OverlayCompositeEffect", OVERLAY_FRAGMENT, { uniforms: new Map([["overlay", new Uniform(overlay)]]) });
  }
}

export interface PostLook {
  exposure: number;
  bloom: number;
  vignette: number;
}

export const DEFAULT_POST_LOOK: PostLook = { exposure: 1, bloom: 0.55, vignette: 0.42 };

export interface Post {
  /** The globe group (its rotation defines the atmosphere's ECEF frame). */
  setGlobe(globe: Object3D): void;
  /** Sun direction in the globe's own frame (null: always day, atmosphere lit from the camera's side). */
  setSun(local: Vector3 | null): void;
  /** 0 = Jukebox view, 1 = close-up: depth of field only in the Jukebox view. */
  setViewBlend(blend: number, focusDistance: number): void;
  setLook(look: Partial<PostLook>): void;
  setSize(width: number, height: number): void;
  /** Whether the atmosphere's precomputed tables are ready. */
  atmosphereReady(): boolean;
  render(dt: number): void;
  dispose(): void;
}

export interface PostOptions {
  /** The aerial-perspective pass: only for scenes with a globe at radius 1 (default on). */
  atmosphere?: boolean;
}

export function createPost(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, tier: Tier, opts: PostOptions = {}): Post {
  const spec = TIER_SPEC[tier];
  const withAtmosphere = opts.atmosphere ?? true;
  const composer = new EffectComposer(renderer, { frameBufferType: HalfFloatType });
  const overlayTarget = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
  const depthOnly = new MeshBasicMaterial({ colorWrite: false });
  let look = DEFAULT_POST_LOOK;

  const atmosphere = new AerialPerspectiveEffect(camera, {
    ellipsoid: SPHERE,
    correctAltitude: false,
    correctGeometricError: false,
    sunLight: false,
    skyLight: false,
    transmittance: true,
    inscatter: true,
    sky: false,
    sun: false,
    moon: false,
  });
  atmosphere.stbnTexture = null;
  let atmosphereTextures: PrecomputedTextures | null = null;
  let disposed = false;
  if (withAtmosphere) {
    new PrecomputedTexturesLoader({ format: "binary", combinedScattering: true, higherOrderScattering: false })
      .setType(renderer)
      .loadAsync(ATMOSPHERE_TABLES)
      .then((t) => {
        if (disposed) {
          for (const tex of Object.values(t)) tex?.dispose();
          return;
        }
        atmosphereTextures = t;
        atmosphere.irradianceTexture = t.irradianceTexture;
        atmosphere.scatteringTexture = t.scatteringTexture;
        atmosphere.transmittanceTexture = t.transmittanceTexture;
        atmosphere.singleMieScatteringTexture = t.singleMieScatteringTexture ?? null;
        atmosphere.higherOrderScatteringTexture = t.higherOrderScatteringTexture ?? null;
        atmospherePass.enabled = true;
      })
      .catch(() => undefined); // tables missing: the globe shows without an atmosphere
  }

  const bloom = new BloomEffect({
    luminanceThreshold: 1,
    luminanceSmoothing: 0.2,
    intensity: look.bloom,
    mipmapBlur: true,
    radius: 0.7,
    levels: spec.cheapBloom ? 4 : 7,
    resolutionScale: spec.cheapBloom ? 0.5 : 1,
  });
  const toneMapping = new ToneMappingEffect({ mode: ToneMappingMode.AGX });
  const vignette = new VignetteEffect({ offset: 0.32, darkness: look.vignette });
  const overlay = new OverlayCompositeEffect(overlayTarget.texture);

  composer.addPass(new RenderPass(scene, camera));
  const normalPass = spec.ao ? new NormalPass(scene, camera) : null;
  if (normalPass) {
    composer.addPass(normalPass);
    const ssao = new SSAOEffect(camera, normalPass.texture, {
      samples: 16,
      radius: 0.06,
      intensity: 2.2,
      luminanceInfluence: 0.5,
      worldDistanceThreshold: 6,
      worldDistanceFalloff: 1,
      worldProximityThreshold: 0.06,
      worldProximityFalloff: 0.03,
      resolutionScale: 0.5,
    });
    composer.addPass(new EffectPass(camera, ssao));
  }
  const atmospherePass = new EffectPass(camera, atmosphere);
  atmospherePass.enabled = false;
  composer.addPass(atmospherePass);
  const dof = spec.dof ? new DepthOfFieldEffect(camera, { focusDistance: 5, focusRange: 2.2, bokehScale: 2.4 }) : null;
  const dofPass = dof ? new EffectPass(camera, dof) : null;
  if (dofPass) composer.addPass(dofPass);
  composer.addPass(new EffectPass(camera, bloom, toneMapping, vignette, overlay));
  composer.addPass(new EffectPass(camera, new SMAAEffect({ preset: SMAAPreset.HIGH })));

  let globe: Object3D | null = null;
  const ecef = new Matrix4();
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
    setGlobe(g) {
      globe = g;
    },
    setSun(local) {
      // ECEF = our axes reordered; the sun is fixed in the Earth's frame at the frame time.
      if (local) atmosphere.sunDirection.set(local.z, local.x, local.y).normalize();
      else atmosphere.sunDirection.copy(camera.position).normalize();
    },
    setViewBlend(blend, focusDistance) {
      if (!dof || !dofPass) return;
      dofPass.enabled = blend < 0.98;
      dof.bokehScale = 2.4 * (1 - blend);
      dof.cocMaterial.focusDistance = focusDistance;
    },
    setLook(l) {
      look = { ...look, ...l };
      renderer.toneMappingExposure = look.exposure;
      bloom.intensity = look.bloom;
      vignette.darkness = look.vignette;
    },
    setSize(width, height) {
      composer.setSize(width, height, false);
      renderer.getDrawingBufferSize(size);
      overlayTarget.setSize(size.x, size.y);
    },
    atmosphereReady: () => atmosphereTextures !== null,
    render(dt) {
      if (globe) {
        globe.updateMatrixWorld();
        atmosphere.worldToECEFMatrix.multiplyMatrices(LOCAL_TO_ECEF, ecef.copy(globe.matrixWorld).invert());
      }
      renderOverlay();
      composer.render(dt);
    },
    dispose() {
      composer.dispose();
      overlayTarget.dispose();
      depthOnly.dispose();
      disposed = true;
      if (atmosphereTextures) for (const tex of Object.values(atmosphereTextures)) tex?.dispose();
    },
  };
}
