// The turntable around the globe, own design, built in code: a smoked-glass
// plinth on a dark anodised base, an aluminium platter, a vinyl record with
// fine grooves, circular sheen and a clean centre label, a short chrome spindle
// and a faint glass rod the globe floats on, and a brushed-aluminium tonearm
// (bearing ring, counterweight, headshell, cable) whose stylus tip glows with
// the needle value's colormap colour. PBR, lit by the studio HDRI.

import {
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Quaternion,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
  type Material,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Palette } from "@/lib/css-tokens";
import { circularAnisotropyMap, grooveNormalMap } from "./deck-textures";
import { asOccluder } from "./layers";

const BASE = { size: new Vector3(4.6, 0.24, 3.8), center: new Vector3(0.35, -1.42, 0.1), bevel: 0.06 };
const GLASS = { thickness: 0.05, bevel: 0.022 };
const PLATTER = { radius: 1.6, height: 0.06, y: -1.2 };
const RECORD = { radius: 1.5, height: 0.012, y: -1.164, labelRadius: 0.48 };
const SPINDLE = { radius: 0.03, bottom: -1.16, top: -1.09 };
const ROD_RADIUS = 0.012;
const PIVOT = new Vector3(2.15, 0.12, 0.95);
const ARM_RADIUS = 0.026;
const HEADSHELL_OFFSET = 0.14;
const NEEDLE_LENGTH = 0.1;
/** The stylus tip's glow: the value colour × this, above the bloom threshold (HDR). */
const STYLUS_GLOW = 6;
/** Where the stylus rests while a record is changed (beside the globe). */
export const ARM_REST = new Vector3(1.55, -0.55, 1.35);

const UP = new Vector3(0, 1, 0);

export interface Deck {
  group: Group;
  /** Turns with the globe. */
  platter: Group;
  /** The record on the platter (lifted during a record change). */
  record: Group;
  /** The tonearm and stylus (hidden in the close-up camera). */
  arm: Group;
  setArm(tip: Vector3, normal: Vector3): void;
  setLabel(canvas: HTMLCanvasElement): void;
  /** The stylus glow: the needle value's colormap colour (0..255), or null for a dim neutral tip. */
  setStylusColor(rgb: [number, number, number] | null): void;
  /** Releases three's shared PBR lookup texture after the renderer is gone (see dispose in scene/index.ts). */
  releaseSharedTextures(): void;
  dispose(): void;
}

function span(mesh: Mesh, from: Vector3, to: Vector3) {
  const dir = new Vector3().subVectors(to, from);
  mesh.position.copy(from).addScaledVector(dir, 0.5);
  mesh.scale.set(1, dir.length(), 1);
  mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
}

export function createDeck(palette: Palette): Deck {
  const geometries: BufferGeometry[] = [];
  const textures: Texture[] = [];
  // three's PBR materials all register on one module-level lookup texture
  // (DFG_LUT); disposing it after our renderer lets that renderer be collected.
  const sharedLuts = new Set<Texture>();
  const physical = (params: ConstructorParameters<typeof MeshPhysicalMaterial>[0]) => {
    const m = new MeshPhysicalMaterial(params);
    m.onBeforeCompile = (shader) => {
      const lut: unknown = shader.uniforms.dfgLUT?.value;
      if (lut instanceof Texture) sharedLuts.add(lut);
    };
    return m;
  };
  const grooves = grooveNormalMap();
  const sheen = circularAnisotropyMap();
  textures.push(grooves, sheen);

  const materials = {
    anodised: physical({ color: new Color(palette.anodised), metalness: 1, roughness: 0.5, anisotropy: 0.4 }),
    glass: physical({
      color: new Color(palette.glass),
      metalness: 0,
      roughness: 0.12,
      clearcoat: 0.6,
      clearcoatRoughness: 0.08,
      specularIntensity: 0.35,
      transparent: true,
      opacity: 0.94,
    }),
    brushed: physical({ color: new Color(palette.metal), metalness: 1, roughness: 0.38, anisotropy: 0.8, anisotropyRotation: Math.PI / 2 }),
    chrome: physical({ color: new Color(palette.metal), metalness: 1, roughness: 0.08 }),
    darkMetal: physical({ color: new Color(palette.anodised), metalness: 0.9, roughness: 0.32 }),
    vinyl: physical({
      color: new Color(palette.vinyl),
      roughness: 0.42,
      clearcoat: 0.55,
      clearcoatRoughness: 0.22,
      normalMap: grooves,
      normalScale: new Vector2(0.35, 0.35),
      anisotropy: 0.6,
      anisotropyMap: sheen,
    }),
    label: physical({ color: new Color(1, 1, 1), roughness: 0.62, clearcoat: 0.2 }),
    rod: physical({ color: new Color(palette.moon), metalness: 0, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.16, depthWrite: false }),
    cable: physical({ color: new Color(palette.vinyl), roughness: 0.5 }),
    stylus: new MeshBasicMaterial({ color: new Color(palette.metal) }),
  };
  const mesh = (geometry: BufferGeometry, material: Material) => {
    geometries.push(geometry);
    return new Mesh(geometry, material);
  };

  const group = new Group();
  const base = mesh(new RoundedBoxGeometry(BASE.size.x, BASE.size.y, BASE.size.z, 6, BASE.bevel), materials.anodised);
  base.position.copy(BASE.center);
  const baseTop = BASE.center.y + BASE.size.y / 2;
  const glass = mesh(new RoundedBoxGeometry(BASE.size.x + 0.02, GLASS.thickness, BASE.size.z + 0.02, 4, GLASS.bevel), materials.glass);
  glass.position.set(BASE.center.x, baseTop + GLASS.thickness / 2 - 0.004, BASE.center.z);
  const plinthTop = baseTop + GLASS.thickness - 0.004;

  const platter = new Group();
  const platterBody = mesh(new CylinderGeometry(PLATTER.radius, PLATTER.radius * 0.985, PLATTER.height, 128), materials.brushed);
  platterBody.position.y = PLATTER.y;
  const record = new Group();
  const vinyl = mesh(new CylinderGeometry(RECORD.radius, RECORD.radius, RECORD.height, 192), materials.vinyl);
  vinyl.position.y = RECORD.y;
  const label = mesh(new CircleGeometry(RECORD.labelRadius, 96), materials.label);
  label.rotation.x = -Math.PI / 2;
  label.position.y = RECORD.y + RECORD.height / 2 + 0.0008;
  record.add(vinyl, label);
  const spindle = mesh(new CylinderGeometry(SPINDLE.radius, SPINDLE.radius, 1, 24), materials.chrome);
  span(spindle, new Vector3(0, SPINDLE.bottom, 0), new Vector3(0, SPINDLE.top, 0));
  const spindleCap = mesh(new SphereGeometry(SPINDLE.radius, 16, 8), materials.chrome);
  spindleCap.position.y = SPINDLE.top;
  // The globe floats a few centimetres above the spindle, on a faint glass rod.
  const rod = mesh(new CylinderGeometry(ROD_RADIUS, ROD_RADIUS, 1, 16), materials.rod);
  span(rod, new Vector3(0, SPINDLE.top, 0), new Vector3(0, -0.995, 0));
  platter.add(platterBody, record, spindle, spindleCap, rod);

  const arm = new Group();
  const armBase = mesh(new CylinderGeometry(0.22, 0.25, 0.08, 48), materials.darkMetal);
  armBase.position.set(PIVOT.x, plinthTop + 0.04, PIVOT.z);
  const post = mesh(new CylinderGeometry(0.045, 0.045, 1, 24), materials.brushed);
  span(post, new Vector3(PIVOT.x, plinthTop, PIVOT.z), PIVOT);
  const bearing = mesh(new TorusGeometry(0.085, 0.018, 16, 48), materials.chrome);
  bearing.position.copy(PIVOT);
  const bearingRing = mesh(new TorusGeometry(0.12, 0.008, 12, 48), materials.darkMetal);
  bearingRing.position.copy(PIVOT);
  bearingRing.rotation.x = Math.PI / 2;
  const tube = mesh(new CylinderGeometry(ARM_RADIUS, ARM_RADIUS, 1, 24), materials.brushed);
  const counterweight = mesh(new CylinderGeometry(0.1, 0.1, 1, 40), materials.darkMetal);
  const headshell = mesh(new RoundedBoxGeometry(0.1, 0.04, 0.18, 3, 0.012), materials.darkMetal);
  const needle = mesh(new ConeGeometry(0.014, NEEDLE_LENGTH, 12), materials.chrome);
  const tip = mesh(new SphereGeometry(0.014, 16, 16), materials.stylus);
  const cableTube = mesh(new CylinderGeometry(0.005, 0.005, 1, 8), materials.cable);
  // The cable runs from the pivot down beside the post and into the plinth.
  const cableDrop = mesh(
    new TubeGeometry(
      new CatmullRomCurve3([
        PIVOT.clone().add(new Vector3(0.06, -0.02, 0.05)),
        new Vector3(PIVOT.x + 0.12, PIVOT.y - 0.5, PIVOT.z + 0.1),
        new Vector3(PIVOT.x + 0.1, plinthTop + 0.01, PIVOT.z + 0.26),
      ]),
      32,
      0.006,
      8,
    ),
    materials.cable,
  );
  arm.add(armBase, post, bearing, bearingRing, tube, counterweight, headshell, needle, tip, cableTube, cableDrop);
  // The arm hides the data layer where it passes in front of the globe.
  asOccluder(arm);

  group.add(base, glass, platter, arm);

  const head = new Vector3();
  const back = new Vector3();
  const inward = new Vector3();
  const side = new Vector3();
  const pointInward = new Quaternion();
  let labelTexture: CanvasTexture | null = null;

  return {
    group,
    platter,
    record,
    arm,
    setArm(tipAt, normal) {
      head.copy(tipAt).addScaledVector(normal, HEADSHELL_OFFSET);
      span(tube, PIVOT, head);
      bearing.lookAt(head);
      back.subVectors(PIVOT, head).normalize();
      span(counterweight, PIVOT.clone().addScaledVector(back, 0.16), PIVOT.clone().addScaledVector(back, 0.36));
      side.crossVectors(back, UP).normalize().multiplyScalar(ARM_RADIUS + 0.008);
      span(cableTube, PIVOT.clone().add(side), head.clone().add(side));
      inward.copy(normal).negate();
      pointInward.setFromUnitVectors(UP, inward);
      headshell.position.copy(head);
      headshell.quaternion.copy(pointInward);
      needle.position.copy(tipAt).addScaledVector(normal, NEEDLE_LENGTH / 2);
      needle.quaternion.copy(pointInward);
      tip.position.copy(tipAt);
    },
    setLabel(canvas) {
      labelTexture?.dispose();
      labelTexture = new CanvasTexture(canvas);
      labelTexture.colorSpace = SRGBColorSpace;
      labelTexture.anisotropy = 8;
      materials.label.map = labelTexture;
      materials.label.needsUpdate = true;
    },
    setStylusColor(rgb) {
      if (rgb) materials.stylus.color.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, SRGBColorSpace).multiplyScalar(STYLUS_GLOW);
      else materials.stylus.color.set(palette.metal);
    },
    releaseSharedTextures() {
      for (const lut of sharedLuts) lut.dispose();
      sharedLuts.clear();
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of Object.values(materials)) m.dispose();
      for (const t of textures) t.dispose();
      labelTexture?.dispose();
    },
  };
}
