// The playable delta, in three.js: Bangladesh in relief (Blue Marble on GEBCO,
// exaggerated), a sea plane, the Ganges (Padma) and Brahmaputra (Jamuna) as
// glowing strings, districts when close, and under the GRACE box a cut-away
// glass block whose water table follows the GRACE month. NW India's block
// stands beside it on the same fixed scale. IMERG rain falls as streaks at the
// rain rule's density and NASA's own frame image lies on the land as a decal.

import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NearestFilter,
  PlaneGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  type PerspectiveCamera,
} from "three";
import type { Palette } from "@/lib/css-tokens";
import type { LatLon } from "@/lib/data";
import type { AreaGeometry, Feature, Position } from "@/lib/geo/types";
import { asOccluder, onOverlay } from "../../Turntable/scene/layers";
import { createStudio } from "../../Turntable/scene/studio";
import { geoPlane, type Bounds, type GeoPlane } from "../plane";
import { createRainParticles, type RainCell } from "../rain-particles";
import { heightOf, reliefMesh, type Relief } from "../relief";

/** Vertical exaggeration of the relief (stated on screen). */
export const RELIEF_EXAGGERATION = 40;
const SEA_FLOOR_M = -150;
/** The aquifer blocks: water-table height range for the voice's fixed input range (scene units). */
const BLOCK = { bottom: -2.4, top: 0.4, gapToMap: 1.2, gapBetween: 1.2, footprint: 0.55 } as const;
const RIVER_RADIUS = 0.022;
const RIVER_GLOW = 2.5; // HDR: only the rivers reach the bloom threshold
const RAIN_TOP = 2.4;
const MAX_STREAKS = 6000;

export interface Box {
  name: "Bangladesh" | "NW_India";
  bounds: Bounds;
}

export interface DeltaRiver {
  name: string;
  paths: Position[][];
}

export interface DeltaSceneData {
  relief: Relief;
  boxes: Box[];
  rivers: DeltaRiver[];
  districts: Feature<unknown, AreaGeometry>[];
  /** The water voice's fixed input range (cm): the blocks' shared scale. */
  range: { min: number; max: number };
}

export interface DeltaLayers {
  rivers: boolean;
  districts: boolean;
  rain: boolean;
  stars: boolean;
}

export interface DeltaScene {
  plane: GeoPlane;
  group: Group;
  /** Scene-unit ground height at a point (relief, or the sea surface). */
  groundAt(lat: number, lon: number): number;
  /** Water-table levels (cm; null = no measurement that month). */
  setLevels(levels: Record<Box["name"], number | null>): void;
  setRain(cells: RainCell[], cellSize: number): void;
  setDecal(bitmap: ImageBitmap | null): void;
  setNeedle(at: LatLon): void;
  setLayers(l: DeltaLayers, cameraDistance: number): void;
  /** Named 3D points for HTML labels. */
  anchors: Map<string, Vector3>;
  /** The point under a screen position (on the sea-level plane), or null. */
  pick(ndcX: number, ndcY: number, camera: PerspectiveCamera): LatLon | null;
  update(dt: number, motion: boolean): void;
  dispose(): void;
}

const DISTRICTS_WITHIN = 9;

function boxMesh(width: number, depth: number, colour: Color, opacity: number) {
  return new Mesh(new BoxGeometry(width, 1, depth), new MeshStandardMaterial({ color: colour, transparent: true, opacity, roughness: 0.15, metalness: 0, depthWrite: false }));
}

export function createDeltaScene(data: DeltaSceneData, palette: Palette): DeltaScene {
  const { relief } = data;
  const plane = relief.plane;
  const group = new Group();
  const studio = createStudio(palette);
  group.add(studio.group);
  const groundAt = (lat: number, lon: number) => Math.max(0, heightOf(Math.max(SEA_FLOOR_M, relief.metresAt(lat, lon)), RELIEF_EXAGGERATION));

  const land = reliefMesh(relief, RELIEF_EXAGGERATION, SEA_FLOOR_M);
  asOccluder(land);
  const sea = new Mesh(new PlaneGeometry(plane.size.x, plane.size.z), new MeshStandardMaterial({ color: new Color(palette.night), transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.2 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = 0.001;
  group.add(land, sea);

  // Rivers: tubes draped on the relief, glowing.
  const riverColour = new Color(palette["geo-river"]).multiplyScalar(RIVER_GLOW);
  const riverMaterial = new MeshBasicMaterial({ color: riverColour });
  const riverGroup = new Group();
  for (const river of data.rivers) {
    for (const path of river.paths) {
      const pts = path.filter(([lon, lat]) => plane.contains(lat, lon)).map(([lon, lat]) => {
        const { x, z } = plane.toXZ(lat, lon);
        return new Vector3(x, groundAt(lat, lon) + RIVER_RADIUS, z);
      });
      if (pts.length < 2) continue;
      riverGroup.add(new Mesh(new TubeGeometry(new CatmullRomCurve3(pts), pts.length * 3, RIVER_RADIUS, 6, false), riverMaterial));
    }
  }
  group.add(riverGroup);

  // Districts: pale lines just above the relief, in the overlay pass (relief occludes them).
  const districtPoints: Vector3[] = [];
  const pushRing = (ring: Position[]) => {
    for (let i = 1; i < ring.length; i++) {
      for (const [lon, lat] of [ring[i - 1], ring[i]]) {
        const { x, z } = plane.toXZ(lat, lon);
        districtPoints.push(new Vector3(x, groundAt(lat, lon) + 0.012, z));
      }
    }
  };
  for (const { geometry: g } of data.districts) {
    if (!g) continue;
    const polys: Position[][][] = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
    for (const poly of polys) for (const ring of poly) pushRing(ring);
  }
  const districts = new LineSegments(new BufferGeometry().setFromPoints(districtPoints), new LineBasicMaterial({ color: new Color(palette["geo-district"]), transparent: true, opacity: 0.7 }));
  onOverlay(districts);
  group.add(districts);

  // The aquifer blocks: glass cases with a water table inside, on one fixed scale.
  const levelY = (cm: number) => BLOCK.bottom + ((cm - data.range.min) / (data.range.max - data.range.min)) * (BLOCK.top - BLOCK.bottom);
  const glass = new Color(palette.metal);
  const water = new Color(palette.atmosphere);
  const anchors = new Map<string, Vector3>();
  const blocks = new Map<Box["name"], { water: Mesh; zero: LineSegments }>();
  // A cut-away column beside the map (east): Bangladesh in front, NW India behind it, one height scale.
  // Footprints are each box's own shape, scaled down (only the height is data).
  const sideX = plane.size.x / 2 + BLOCK.gapToMap;
  data.boxes.forEach((box, i) => {
    const own = geoPlane(box.bounds);
    const width = own.size.x * BLOCK.footprint;
    const depth = own.size.z * BLOCK.footprint;
    const centre = new Vector3(sideX + width / 2, 0, (i === 0 ? 1 : -1) * (depth / 2 + BLOCK.gapBetween / 2));
    const caseHeight = BLOCK.top - BLOCK.bottom;
    const glassCase = boxMesh(width, depth, glass, 0.08);
    glassCase.scale.y = caseHeight;
    glassCase.position.set(centre.x, BLOCK.bottom + caseHeight / 2, centre.z);
    const edges = new LineSegments(new EdgesGeometry(glassCase.geometry), new LineBasicMaterial({ color: glass, transparent: true, opacity: 0.5 }));
    edges.scale.copy(glassCase.scale);
    edges.position.copy(glassCase.position);
    const waterMesh = boxMesh(width * 0.98, depth * 0.98, water, 0.62);
    waterMesh.position.set(centre.x, 0, centre.z);
    // The 0 cm line (the 2004–2009 average): a reference on both blocks.
    const zero = new LineSegments(new EdgesGeometry(new BoxGeometry(width, 0, depth)), new LineBasicMaterial({ color: new Color(palette.amber) }));
    zero.position.set(centre.x, levelY(0), centre.z);
    group.add(glassCase, edges, waterMesh, zero);
    blocks.set(box.name, { water: waterMesh, zero });
    anchors.set(box.name, new Vector3(centre.x, BLOCK.top + 0.25, centre.z + depth / 2));
  });

  // Rain: streaks at the rule's density, and NASA's frame image as a decal on the overlay pass.
  const rain = createRainParticles({ max: MAX_STREAKS, top: RAIN_TOP, groundAt: (x, z) => groundAt(plane.toLatLon(x, z).lat, plane.toLatLon(x, z).lon), colour: palette.atmosphere });
  group.add(rain.object);
  const decalMaterial = new MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.85 });
  const decal = new Mesh(new PlaneGeometry(plane.size.x, plane.size.z), decalMaterial);
  decal.rotation.x = -Math.PI / 2;
  decal.position.y = 0.03;
  onOverlay(decal);
  group.add(decal);
  let decalTexture: CanvasTexture<ImageBitmap> | null = null;

  // The needle: a small amber pin standing on the ground.
  const pin = new Mesh(new BoxGeometry(0.03, 0.5, 0.03), new MeshBasicMaterial({ color: new Color(palette.amber).multiplyScalar(3) }));
  group.add(pin);

  return {
    plane,
    group,
    groundAt,
    anchors,
    setLevels(levels) {
      for (const [name, b] of blocks) {
        const cm = levels[name];
        b.water.visible = cm !== null;
        if (cm === null) continue;
        const top = levelY(Math.min(data.range.max, Math.max(data.range.min, cm)));
        b.water.scale.y = Math.max(0.001, top - BLOCK.bottom);
        b.water.position.y = BLOCK.bottom + b.water.scale.y / 2;
      }
    },
    setRain(cells, cellSize) {
      rain.setCells(cells, cellSize);
    },
    setDecal(bitmap) {
      decalTexture?.dispose();
      decalTexture = null;
      if (bitmap) {
        const tex = new CanvasTexture(bitmap);
        tex.colorSpace = SRGBColorSpace;
        tex.magFilter = NearestFilter;
        tex.flipY = false;
        decalTexture = tex;
      }
      decalMaterial.map = decalTexture;
      decalMaterial.visible = decalTexture !== null;
      decalMaterial.needsUpdate = true;
    },
    setNeedle(at) {
      const { x, z } = plane.toXZ(at.lat, at.lon);
      pin.position.set(x, groundAt(at.lat, at.lon) + 0.25, z);
    },
    setLayers(l, cameraDistance) {
      riverGroup.visible = l.rivers;
      districts.visible = l.districts && cameraDistance < DISTRICTS_WITHIN;
      decal.visible = l.rain;
      rain.object.visible = l.rain;
      studio.setStars(l.stars ? 1 : 0);
    },
    pick(ndcX, ndcY, camera) {
      const origin = camera.position.clone();
      const dir = new Vector3(ndcX, ndcY, 0.5).unproject(camera).sub(origin).normalize();
      if (dir.y >= 0) return null;
      const t = -origin.y / dir.y;
      const hit = origin.addScaledVector(dir, t);
      const at = plane.toLatLon(hit.x, hit.z);
      return plane.contains(at.lat, at.lon) ? at : null;
    },
    update(dt, motion) {
      rain.update(dt, motion && decal.visible);
    },
    dispose() {
      group.traverse((o) => {
        if (o instanceof Mesh || o instanceof LineSegments) {
          o.geometry.dispose();
          const m = o.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
      decalTexture?.dispose();
      relief.colour.dispose();
      rain.dispose();
      studio.dispose();
    },
  };
}
