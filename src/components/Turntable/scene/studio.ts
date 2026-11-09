// The space around the turntable: a flat night sky and a field of stars. Decoration only.
// `exact` draws them in the overlay pass, after tone mapping, so the sky is exactly the
// --space colour; the deck and the globe are depth-only occluders there, so they stay in front.

import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  SphereGeometry,
} from "three";
import type { Palette } from "@/lib/css-tokens";
import { onOverlay } from "./layers";

const SKY_RADIUS = 60;
/** About 50 × the globe's radius (1). */
const STAR_RADIUS = 50;
const STAR_COUNT = 800;
const WARM_SHARE = 0.05;
const STAR_SIZE_PX = 2;

export interface Studio {
  group: Group;
  /** 0 = hidden, 1 = shown. */
  setStars(opacity: number): void;
  dispose(): void;
}

/** A deterministic pseudo-random sequence, so the sky is the same every visit. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function createStudio(palette: Palette, options: { exact?: boolean } = {}): Studio {
  const skyGeometry = new SphereGeometry(SKY_RADIUS, 32, 16);
  const skyMaterial = new MeshBasicMaterial({ color: new Color(palette.space), side: BackSide, toneMapped: false, depthWrite: false });
  const sky = new Mesh(skyGeometry, skyMaterial);
  sky.renderOrder = -2;

  const random = seeded(20260925);
  const paper = new Color(palette.star);
  const warm = new Color(palette["star-warm"]);
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    const z = random() * 2 - 1;
    const a = random() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    positions.set([r * Math.cos(a) * STAR_RADIUS, z * STAR_RADIUS, r * Math.sin(a) * STAR_RADIUS], i * 3);
    const tint = random() < WARM_SHARE ? warm : paper;
    colors.set([tint.r, tint.g, tint.b], i * 3);
  }
  const starGeometry = new BufferGeometry();
  starGeometry.setAttribute("position", new BufferAttribute(positions, 3));
  starGeometry.setAttribute("color", new BufferAttribute(colors, 3));
  const starMaterial = new PointsMaterial({ size: STAR_SIZE_PX, sizeAttenuation: false, vertexColors: true, toneMapped: false, depthWrite: false });
  const stars = new Points(starGeometry, starMaterial);
  stars.renderOrder = -1;
  stars.visible = false;
  // Never hit by picking or the needle's rays.
  stars.raycast = () => undefined;
  sky.raycast = () => undefined;

  const group = new Group();
  group.add(sky, stars);
  if (options.exact) onOverlay(group);

  return {
    group,
    setStars(opacity) {
      stars.visible = opacity > 0.01;
    },
    dispose() {
      skyGeometry.dispose();
      starGeometry.dispose();
      skyMaterial.dispose();
      starMaterial.dispose();
    },
  };
}
