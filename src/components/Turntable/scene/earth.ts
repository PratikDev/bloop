// The globe: flat land in the interface's land colour, quantised to two light
// steps (land only), and the data frame above it (the sonified layer). The data
// frame sits on its own sphere in the overlay pass, so its colours are exact.

import { CanvasTexture, Color, Group, Mesh, ShaderMaterial, SRGBColorSpace, Vector3 } from "three";
import type { Palette } from "@/lib/css-tokens";
import { globeGeometry } from "./geometry";
import { asOccluder, onOverlay } from "./layers";

export const EARTH_RADIUS = 1;
const DATA_RADIUS = 1.0015;
const SEGMENTS = { cols: 512, rows: 256 } as const;
/** The land's shaded step, as a share of its lit colour. */
const SHADE = 0.75;

const SURFACE_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vPos;
void main() {
  vUv = uv;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const LAND_FRAGMENT = /* glsl */ `
uniform vec3 sunDir;       // object space
uniform float alwaysDay;
uniform vec3 land;
varying vec3 vPos;
void main() {
  float lit = max(step(0.0, dot(normalize(vPos), sunDir)), alwaysDay);
  gl_FragColor = vec4(land * mix(${SHADE.toFixed(2)}, 1.0, lit), 1.0);
  #include <colorspace_fragment>
}`;

const DATA_FRAGMENT = /* glsl */ `
uniform sampler2D dataMap;
uniform float opacity;
varying vec2 vUv;
void main() {
  vec4 texel = texture2D(dataMap, vUv);
  gl_FragColor = vec4(texel.rgb, texel.a * opacity);
  #include <colorspace_fragment>
}`;

export interface Earth {
  /** Spins with the globe: the land and the data frame. */
  surface: Group;
  /** Sun direction in the globe's own frame; null = always day. */
  setSun(dir: Vector3 | null): void;
  dataChanged(): void;
  setDataOpacity(opacity: number): void;
  dispose(): void;
}

export function createEarth(palette: Palette, dataCanvas: HTMLCanvasElement, anisotropy: number): Earth {
  const geometry = globeGeometry(EARTH_RADIUS, SEGMENTS.cols, SEGMENTS.rows);
  const dataGeometry = globeGeometry(DATA_RADIUS, SEGMENTS.cols / 2, SEGMENTS.rows / 2);

  const uniforms = { sunDir: { value: new Vector3(0, 0, 1) }, alwaysDay: { value: 1 }, land: { value: new Color(palette.land) } };
  const landMaterial = new ShaderMaterial({ uniforms, vertexShader: SURFACE_VERTEX, fragmentShader: LAND_FRAGMENT });
  const land = new Mesh(geometry, landMaterial);
  asOccluder(land);

  const dataTexture = new CanvasTexture(dataCanvas);
  dataTexture.colorSpace = SRGBColorSpace;
  dataTexture.anisotropy = anisotropy;
  const dataUniforms = { dataMap: { value: dataTexture }, opacity: { value: 1 } };
  const dataMaterial = new ShaderMaterial({
    uniforms: dataUniforms,
    vertexShader: SURFACE_VERTEX,
    fragmentShader: DATA_FRAGMENT,
    transparent: true,
    depthWrite: false,
  });
  const data = new Mesh(dataGeometry, dataMaterial);
  onOverlay(data);

  const surface = new Group();
  surface.add(land, data);

  return {
    surface,
    setSun(dir) {
      uniforms.alwaysDay.value = dir ? 0 : 1;
      if (dir) uniforms.sunDir.value.copy(dir).normalize();
    },
    dataChanged() {
      dataTexture.needsUpdate = true;
    },
    setDataOpacity(opacity) {
      dataUniforms.opacity.value = opacity;
      data.visible = opacity > 0;
    },
    dispose() {
      geometry.dispose();
      dataGeometry.dispose();
      landMaterial.dispose();
      dataMaterial.dispose();
      dataTexture.dispose();
    },
  };
}
