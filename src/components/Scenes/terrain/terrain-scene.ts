// Sound terrain, in three.js: today's SST over the Bay of Bengal as a height
// field (height = temperature on the zoomed axis, a fixed stated scale),
// coloured by sampling NASA's own frame image and shaded in lightness only, in
// the overlay pass so the colours are never shifted. Land is the Blue Marble +
// GEBCO relief. IMERG rain falls as streak sheets under NASA's rain image; the
// walker is an amber light on the surface; the warmest water sparkles when found.

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PlaneGeometry,
  Points,
  PointsMaterial,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  type Texture,
} from "three";
import type { Palette } from "@/lib/css-tokens";
import type { LatLon } from "@/lib/data";
import { asOccluder, onOverlay } from "../../Turntable/scene/layers";
import { createStudio } from "../../Turntable/scene/studio";
import { METRES_PER_DEGREE } from "../plane";
import { createRainParticles, type RainCell } from "../rain-particles";
import { reliefMesh, type Relief } from "../relief";
import type { TerrainField } from "./field";

/** Scene units of height per °C on the zoomed axis (stated on screen in km). */
export const UNITS_PER_DEGREE_C = 0.7;
export const KM_PER_DEGREE_C = (UNITS_PER_DEGREE_C * METRES_PER_DEGREE) / 1000;
const SEA_BASE = 0.08;
const LAND_EXAGGERATION = 15;
const CLOUD_Y = 5.4;
const MAX_STREAKS = 9000;
const SPARKLE_COUNT = 140;
const SPARKLE_SEC = 2.4;

const VERTEX = /* glsl */ `
attribute float valid;
varying vec2 vUv;
varying float vValid;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vValid = valid;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const FRAGMENT = /* glsl */ `
uniform sampler2D map;
uniform vec3 lightDir;
varying vec2 vUv;
varying float vValid;
varying vec3 vWorld;
void main() {
  if (vValid < 0.999) discard; // land or no data: no terrain (the relief shows)
  vec3 c = texture2D(map, vUv).rgb;
  vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  float shade = 0.55 + 0.45 * max(dot(n, lightDir), 0.0); // lightness only: the hue stays NASA's
  gl_FragColor = vec4(c * shade, 1.0);
}`;

export interface TerrainLayers {
  relief: boolean;
  rain: boolean;
  stars: boolean;
}

export interface TerrainScene {
  group: Group;
  /** Surface height (terrain over the sea, relief over land) at a point. */
  surfaceAt(lat: number, lon: number): number;
  setWalker(at: LatLon): void;
  setRain(cells: RainCell[], cellSize: number): void;
  setDecal(bitmap: ImageBitmap | null): void;
  setLayers(l: TerrainLayers): void;
  sparkle(at: LatLon, motion: boolean): void;
  update(dt: number, motion: boolean): void;
  dispose(): void;
}

export function createTerrainScene(o: { field: TerrainField; relief: Relief; sstImage: Texture; palette: Palette }): TerrainScene {
  const { field, relief, palette } = o;
  const plane = relief.plane;
  const group = new Group();
  const studio = createStudio(palette);
  group.add(studio.group);
  const heightC = (v: number) => SEA_BASE + (v - field.axis.min) * UNITS_PER_DEGREE_C;

  // The SST terrain: one vertex per grid cell centre, quads between them.
  const rows = field.lats.length;
  const cols = field.lons.length;
  const positions = new Float32Array(rows * cols * 3);
  const uvs = new Float32Array(rows * cols * 2);
  const valid = new Float32Array(rows * cols);
  field.lats.forEach((lat, r) =>
    field.lons.forEach((lon, c) => {
      const i = r * cols + c;
      const v = field.values[r][c];
      const { x, z } = plane.toXZ(lat, lon);
      positions.set([x, v === null ? SEA_BASE : heightC(v), z], i * 3);
      uvs.set([(lon + 180) / 360, (lat + 90) / 180], i * 2);
      valid[i] = v === null ? 0 : 1;
    }),
  );
  const index: number[] = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      index.push(a, a + cols, a + 1, a + 1, a + cols, a + cols + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
  geometry.setAttribute("valid", new BufferAttribute(valid, 1));
  geometry.setIndex(index);
  o.sstImage.colorSpace = SRGBColorSpace;
  const terrainMaterial = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: { map: { value: o.sstImage }, lightDir: { value: new Vector3(-0.4, 0.8, 0.45).normalize() } },
  });
  const terrain = new Mesh(geometry, terrainMaterial);
  onOverlay(terrain);
  group.add(terrain);

  // Land: the relief, lit, in the main pass; it hides the terrain's edges behind hills.
  const land = reliefMesh(relief, LAND_EXAGGERATION, 0);
  asOccluder(land);
  group.add(land);

  const sampleField = (lat: number, lon: number) => {
    const fr = ((field.lats[0] - lat) / (field.lats[0] - field.lats[rows - 1])) * (rows - 1);
    const fc = ((lon - field.lons[0]) / (field.lons[cols - 1] - field.lons[0])) * (cols - 1);
    if (fr < 0 || fc < 0 || fr > rows - 1 || fc > cols - 1) return null;
    return field.values[Math.round(fr)][Math.round(fc)];
  };
  const surfaceAt = (lat: number, lon: number) => {
    const v = sampleField(lat, lon);
    return v === null ? Math.max(SEA_BASE, (relief.metresAt(lat, lon) / METRES_PER_DEGREE) * LAND_EXAGGERATION) : heightC(v);
  };

  // The walker: an amber light on the surface.
  const amber = new Color(palette.amber);
  const walker = new Mesh(new SphereGeometry(0.06, 20, 12), new MeshBasicMaterial({ color: amber.clone().multiplyScalar(4) }));
  group.add(walker);

  // Rain: streak sheets at the rule's density, under NASA's rain image as a cloud layer.
  const toLatLon = (x: number, z: number) => plane.toLatLon(x, z);
  const rain = createRainParticles({ max: MAX_STREAKS, top: CLOUD_Y, groundAt: (x, z) => surfaceAt(toLatLon(x, z).lat, toLatLon(x, z).lon), colour: palette.atmosphere });
  group.add(rain.object);
  const cloudMaterial = new MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.6 });
  const cloud = new Mesh(new PlaneGeometry(plane.size.x, plane.size.z), cloudMaterial);
  cloud.rotation.x = -Math.PI / 2;
  cloud.position.y = CLOUD_Y;
  onOverlay(cloud);
  group.add(cloud);
  let cloudTexture: CanvasTexture<ImageBitmap> | null = null;

  // The sparkle: a burst of points at the warmest water.
  const sparklePositions = new Float32Array(SPARKLE_COUNT * 3);
  const sparkleVelocity = new Float32Array(SPARKLE_COUNT * 3);
  const sparkleGeometry = new BufferGeometry();
  sparkleGeometry.setAttribute("position", new BufferAttribute(sparklePositions, 3));
  const sparkleMaterial = new PointsMaterial({ color: amber.clone().multiplyScalar(5), size: 0.05, transparent: true, blending: AdditiveBlending, depthWrite: false });
  const sparkles = new Points(sparkleGeometry, sparkleMaterial);
  sparkles.visible = false;
  sparkles.frustumCulled = false;
  group.add(sparkles);
  let sparkleAge = Infinity;
  let sparkleMoving = true;

  return {
    group,
    surfaceAt,
    setWalker(at) {
      const { x, z } = plane.toXZ(at.lat, at.lon);
      walker.position.set(x, surfaceAt(at.lat, at.lon) + 0.08, z);
    },
    setRain(cells, cellSize) {
      rain.setCells(cells, cellSize);
    },
    setDecal(bitmap) {
      cloudTexture?.dispose();
      cloudTexture = null;
      if (bitmap) {
        const tex = new CanvasTexture(bitmap);
        tex.colorSpace = SRGBColorSpace;
        tex.magFilter = NearestFilter;
        tex.flipY = false;
        cloudTexture = tex;
      }
      cloudMaterial.map = cloudTexture;
      cloudMaterial.visible = cloudTexture !== null;
      cloudMaterial.needsUpdate = true;
    },
    setLayers(l) {
      land.visible = l.relief;
      cloud.visible = l.rain && cloudTexture !== null;
      rain.object.visible = l.rain;
      studio.setStars(l.stars ? 1 : 0);
    },
    sparkle(at, motion) {
      const { x, z } = plane.toXZ(at.lat, at.lon);
      const y = surfaceAt(at.lat, at.lon) + 0.1;
      for (let i = 0; i < SPARKLE_COUNT; i++) {
        const a = Math.random() * Math.PI * 2;
        const up = Math.random();
        sparklePositions.set([x, y, z], i * 3);
        sparkleVelocity.set([Math.cos(a) * (0.3 + Math.random() * 0.5), 0.4 + up, Math.sin(a) * (0.3 + Math.random() * 0.5)], i * 3);
        // Reduced motion: a still ring of light, no burst.
        if (!motion) sparklePositions.set([x + Math.cos(a) * 0.25, y + up * 0.3, z + Math.sin(a) * 0.25], i * 3);
      }
      (sparkleGeometry.getAttribute("position") as BufferAttribute).needsUpdate = true;
      sparkleAge = 0;
      sparkleMoving = motion;
      sparkles.visible = true;
    },
    update(dt, motion) {
      rain.update(dt, motion && rain.object.visible);
      if (sparkleAge < SPARKLE_SEC) {
        sparkleAge += dt;
        if (sparkleMoving) {
          for (let i = 0; i < SPARKLE_COUNT * 3; i++) sparklePositions[i] += sparkleVelocity[i] * dt;
          (sparkleGeometry.getAttribute("position") as BufferAttribute).needsUpdate = true;
        }
        sparkleMaterial.opacity = Math.max(0, 1 - sparkleAge / SPARKLE_SEC);
        sparkles.visible = sparkleAge < SPARKLE_SEC;
      }
    },
    dispose() {
      group.traverse((x) => {
        if (x instanceof Mesh || x instanceof Points) {
          x.geometry.dispose();
          const m = x.material;
          if (Array.isArray(m)) m.forEach((y) => y.dispose());
          else m.dispose();
        }
      });
      cloudTexture?.dispose();
      o.sstImage.dispose();
      relief.colour.dispose();
      rain.dispose();
      studio.dispose();
    },
  };
}
