// Orientation lines on the globe: borders and coastlines, Bangladesh districts,
// rivers and a graticule. They spin with the surface, appear by zoom level, and
// are drawn in the overlay pass (above the data frame, never tone-mapped).

import { Color, Group, LineBasicMaterial, LineSegments, type BufferGeometry } from "three";
import type { Palette } from "@/lib/css-tokens";
import type { AreaGeometry, Feature, LineGeometry, Position, RiverProps } from "@/lib/geo/types";
import { meridian, parallel, pathsGeometry } from "./geometry";
import type { LayerToggles } from "../settings";
import { onOverlay } from "./layers";

/** Latitudes of the graticule's labelled lines: equator, tropics (≈23.44°, Earth's tilt), 30° and 60°. */
export const GRATICULE_LATS = [0, 23.44, -23.44, 30, -30, 60, -60] as const;

export interface OverlayData {
  countriesWorld: Feature<unknown, AreaGeometry>[];
  countriesDetail: Feature<unknown, AreaGeometry>[];
  districts: Feature<unknown, AreaGeometry>[];
  rivers: Feature<RiverProps, LineGeometry>[];
}

export interface OverlayVisibility extends Omit<LayerToggles, "clouds"> {
  /** Camera distance from the globe's centre, in radii. */
  distance: number;
}

export interface Overlays {
  group: Group;
  setData(data: OverlayData): void;
  setVisibility(v: OverlayVisibility): void;
  dispose(): void;
}

/** Zoom thresholds (camera distance, globe radii): where detail switches on. Design choices. */
export const ZOOM = { detailBorders: 2.4, districts: 1.9, allRivers: 1.9 } as const;

function areaPaths(features: Feature<unknown, AreaGeometry>[]): Position[][] {
  const paths: Position[][] = [];
  for (const f of features) {
    if (!f.geometry) continue;
    const polygons = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const rings of polygons) paths.push(...rings);
  }
  return paths;
}

function linePaths(features: Feature<unknown, LineGeometry>[]): Position[][] {
  return features.flatMap((f) => (!f.geometry ? [] : f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates));
}

export function createOverlays(palette: Palette): Overlays {
  const group = new Group();
  const geometries: BufferGeometry[] = [];
  const material = (token: keyof Palette, opacity: number) =>
    new LineBasicMaterial({ color: new Color(palette[token]), transparent: true, opacity, depthWrite: false });
  const materials = {
    border: material("geo-border", 0.6),
    district: material("geo-district", 0.45),
    river: material("geo-river", 0.45),
    riverMajor: material("geo-river", 0.85),
    graticule: material("geo-graticule", 0.3),
  };
  const layer = (paths: Position[][], radius: number, m: LineBasicMaterial) => {
    const g = pathsGeometry(paths, radius);
    geometries.push(g);
    const lines = new LineSegments(g, m);
    lines.renderOrder = 2;
    onOverlay(lines);
    group.add(lines);
    return lines;
  };

  const graticule = layer(
    [...GRATICULE_LATS.map((lat) => parallel(lat)), ...[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180].map((lon) => meridian(lon))],
    1.002,
    materials.graticule,
  );
  let layers: Record<"world" | "detail" | "districts" | "rivers" | "riversMajor", LineSegments> | null = null;

  return {
    group,
    setData(data) {
      layers = {
        world: layer(areaPaths(data.countriesWorld), 1.0025, materials.border),
        detail: layer(areaPaths(data.countriesDetail), 1.0026, materials.border),
        districts: layer(areaPaths(data.districts), 1.0027, materials.district),
        rivers: layer(linePaths(data.rivers.filter((f) => !f.properties.highlight)), 1.0024, materials.river),
        riversMajor: layer(linePaths(data.rivers.filter((f) => f.properties.highlight)), 1.0024, materials.riverMajor),
      };
    },
    setVisibility({ distance, graticule: showGraticule, borders, districts, rivers }) {
      graticule.visible = showGraticule;
      if (!layers) return;
      // The 10m South Asia borders replace the 110m ones close up (the world layer stays for elsewhere).
      layers.detail.visible = borders && distance < ZOOM.detailBorders;
      layers.world.visible = borders;
      layers.districts.visible = districts && distance < ZOOM.districts;
      layers.rivers.visible = rivers && distance < ZOOM.allRivers;
      layers.riversMajor.visible = rivers;
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of Object.values(materials)) m.dispose();
    },
  };
}
