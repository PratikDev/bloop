// The three.js scene: the globe (its mesh built with latLonToSphere, textured
// with the 2D map's own drawing), the deck around it, a fixed camera and lights.
// The globe spins about its polar axis; the needle stays at one azimuth, so the
// longitude under it is set by the spin and its latitude is the groove.
// TODO(turntable: more scenes): the Amphan cold scar, the playable delta and the
// satellite orrery would be sibling scenes reusing latLonToSphere and the deck.

import {
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Sphere,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import type { Palette } from "@/lib/css-tokens";
import type { LatLon } from "@/lib/data";
import { latLonToSphere, sphereHitToLatLon } from "@/lib/sphere";
import { createDeck, GLOBE_RADIUS } from "./deck";

/** Where the needle sits, as an azimuth on the unturned globe (front right, so the camera sees it). */
export const NEEDLE_AZIMUTH_DEG = 35;
const MAX_PIXEL_RATIO = 2;
const MAX_ANISOTROPY = 8;
const GLOBE_SEGMENTS = { lon: 128, lat: 64 };
const CAMERA = { fov: 32, position: new Vector3(0.6, 1.3, 5.9), target: new Vector3(0.35, -0.3, 0) };
const RAD = Math.PI / 180;

export interface TurntableScene {
  /** Turns the globe so `lon` is under the needle, with the needle on `lat`, lifted by `lift`. */
  setPose(lat: number, lon: number, lift: number): void;
  /** What the needle reads: the globe point under its tip, back through sphereHitToLatLon. */
  readNeedle(): LatLon;
  /** The globe point under a canvas position (normalised device coordinates), or null off the globe. */
  pick(ndc: Vector2): LatLon | null;
  /** The needle tip in normalised device coordinates (for the debug picking test). */
  needleNdc(): Vector2;
  resize(width: number, height: number): void;
  /** Call after the texture canvas has been redrawn. */
  textureChanged(): void;
  render(): void;
  dispose(): void;
}

/** A UV sphere whose vertices come from latLonToSphere: u = (lon + 180) / 360, v = (lat + 90) / 180. */
function globeGeometry(radius: number): BufferGeometry {
  const { lon: cols, lat: rows } = GLOBE_SEGMENTS;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= rows; i++) {
    const lat = 90 - (i / rows) * 180;
    for (let j = 0; j <= cols; j++) {
      const lon = -180 + (j / cols) * 360;
      const p = latLonToSphere(lat, lon, radius);
      positions.push(p.x, p.y, p.z);
      uvs.push(j / cols, 1 - i / rows);
    }
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j;
      const b = a + cols + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  return geometry;
}

export function createTurntableScene(canvas: HTMLCanvasElement, textureCanvas: HTMLCanvasElement, palette: Palette): TurntableScene {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.setClearColor(new Color(palette.night));

  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA.fov, 1, 0.1, 50);
  camera.position.copy(CAMERA.position);
  camera.lookAt(CAMERA.target);
  camera.updateMatrixWorld(); // picking can run before the first render

  const light = new Color(palette.moon);
  const sun = new DirectionalLight(light, 1.6);
  sun.position.set(3, 5, 4);
  scene.add(new AmbientLight(light, 0.7), sun);

  // Unlit, so the frame's colours reach the screen as NASA drew them.
  const texture = new CanvasTexture(textureCanvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = Math.min(MAX_ANISOTROPY, renderer.capabilities.getMaxAnisotropy());
  const globeMaterial = new MeshBasicMaterial({ map: texture });
  const globe = new Mesh(globeGeometry(GLOBE_RADIUS), globeMaterial);
  const deck = createDeck(palette);
  scene.add(globe, deck.group);

  const globeSphere = new Sphere(new Vector3(), GLOBE_RADIUS);
  const raycaster = new Raycaster();
  const tip = new Vector3();
  const normal = new Vector3();
  const local = new Vector3();

  const surfacePoint = () => {
    // The tip without its lift: the point the needle reads.
    local.copy(normal).multiplyScalar(GLOBE_RADIUS);
    return globe.worldToLocal(local);
  };

  return {
    setPose(lat, lon, lift) {
      const spin = (NEEDLE_AZIMUTH_DEG - lon) * RAD;
      globe.rotation.y = spin;
      deck.platter.rotation.y = spin;
      globe.updateMatrixWorld();
      const n = latLonToSphere(lat, NEEDLE_AZIMUTH_DEG);
      normal.set(n.x, n.y, n.z);
      tip.copy(normal).multiplyScalar(GLOBE_RADIUS + lift);
      deck.setArm(tip, normal);
    },
    readNeedle() {
      return sphereHitToLatLon(surfacePoint());
    },
    pick(ndc) {
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.ray.intersectSphere(globeSphere, new Vector3());
      return hit ? sphereHitToLatLon(globe.worldToLocal(hit)) : null;
    },
    needleNdc() {
      const p = normal.clone().multiplyScalar(GLOBE_RADIUS).project(camera);
      return new Vector2(p.x, p.y);
    },
    resize(width, height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    textureChanged() {
      texture.needsUpdate = true;
    },
    render() {
      renderer.render(scene, camera);
    },
    dispose() {
      globe.geometry.dispose();
      globeMaterial.dispose();
      texture.dispose();
      deck.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
