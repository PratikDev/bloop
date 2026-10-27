// The turntable around the globe, own design, built in code: a satin plinth,
// a vinyl record with grooves and a label, a chrome spindle, and a metal tonearm
// (gimbal, counterweight, headshell, glowing stylus). PBR lit by RoomEnvironment.
// Colours come from the CSS tokens.

import {
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TorusGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
  type Material,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Palette } from "@/lib/css-tokens";
import { grooveNormalMap, shadowTexture } from "./deck-textures";

const PLINTH = { size: new Vector3(4.6, 0.3, 3.8), center: new Vector3(0.35, -1.35, 0.1) };
const PLATTER = { radius: 1.6, height: 0.05, y: -1.175 };
const RECORD = { radius: 1.5, height: 0.014, y: -1.143, labelRadius: 0.5 };
const SPINDLE = { radius: 0.045, bottom: -1.15, top: -0.975 };
const PIVOT = new Vector3(2.15, 0.12, 0.95);
const ARM_RADIUS = 0.03;
const HEADSHELL_OFFSET = 0.14;
const NEEDLE_LENGTH = 0.11;
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
  const shadow = shadowTexture();
  textures.push(grooves, shadow);

  const materials = {
    plinth: physical({ color: new Color(palette.plinth), roughness: 0.55, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
    metal: physical({ color: new Color(palette.metal), metalness: 1, roughness: 0.26 }),
    darkMetal: physical({ color: new Color(palette.plinth), metalness: 0.9, roughness: 0.35 }),
    vinyl: physical({
      color: new Color(palette.vinyl),
      roughness: 0.5,
      clearcoat: 0.8,
      clearcoatRoughness: 0.25,
      sheen: 0.12,
      sheenColor: new Color(palette.haze),
      normalMap: grooves,
      normalScale: new Vector2(0.6, 0.6),
    }),
    label: physical({ color: new Color(palette.moon), roughness: 0.75 }),
    stylus: new MeshBasicMaterial({ color: new Color(palette.shapla) }),
    shadow: new MeshBasicMaterial({ map: shadow, transparent: true, depthWrite: false }),
  };
  const mesh = (geometry: BufferGeometry, material: Material) => {
    geometries.push(geometry);
    return new Mesh(geometry, material);
  };

  const group = new Group();
  const plinth = mesh(new RoundedBoxGeometry(PLINTH.size.x, PLINTH.size.y, PLINTH.size.z, 4, 0.08), materials.plinth);
  plinth.position.copy(PLINTH.center);
  const plinthTop = PLINTH.center.y + PLINTH.size.y / 2;
  const deckShadow = mesh(new PlaneGeometry(4.4, 4.4), materials.shadow);
  deckShadow.rotation.x = -Math.PI / 2;
  deckShadow.position.set(0, plinthTop + 0.002, 0);

  const platter = new Group();
  const platterBody = mesh(new CylinderGeometry(PLATTER.radius, PLATTER.radius, PLATTER.height, 96), materials.metal);
  platterBody.position.y = PLATTER.y;
  const record = new Group();
  const vinyl = mesh(new CylinderGeometry(RECORD.radius, RECORD.radius, RECORD.height, 128), materials.vinyl);
  vinyl.position.y = RECORD.y;
  const label = mesh(new CircleGeometry(RECORD.labelRadius, 64), materials.label);
  label.rotation.x = -Math.PI / 2;
  label.position.y = RECORD.y + RECORD.height / 2 + 0.001;
  record.add(vinyl, label);
  const globeShadow = mesh(new CircleGeometry(0.9, 48), materials.shadow);
  globeShadow.rotation.x = -Math.PI / 2;
  globeShadow.position.y = label.position.y + 0.001;
  const spindle = mesh(new CylinderGeometry(SPINDLE.radius, SPINDLE.radius, 1, 16), materials.metal);
  span(spindle, new Vector3(0, SPINDLE.bottom, 0), new Vector3(0, SPINDLE.top, 0));
  platter.add(platterBody, record, globeShadow, spindle);

  const arm = new Group();
  const base = mesh(new CylinderGeometry(0.2, 0.24, 0.1, 32), materials.darkMetal);
  base.position.set(PIVOT.x, plinthTop + 0.05, PIVOT.z);
  const post = mesh(new CylinderGeometry(0.05, 0.05, 1, 16), materials.metal);
  span(post, new Vector3(PIVOT.x, plinthTop, PIVOT.z), PIVOT);
  const gimbal = mesh(new TorusGeometry(0.1, 0.022, 12, 32), materials.metal);
  gimbal.position.copy(PIVOT);
  const tube = mesh(new CylinderGeometry(ARM_RADIUS, ARM_RADIUS, 1, 16), materials.metal);
  const counterweight = mesh(new CylinderGeometry(0.11, 0.11, 1, 24), materials.darkMetal);
  const headshell = mesh(new RoundedBoxGeometry(0.12, 0.05, 0.2, 2, 0.015), materials.metal);
  const needle = mesh(new ConeGeometry(0.018, NEEDLE_LENGTH, 12), materials.metal);
  const tip = mesh(new SphereGeometry(0.016, 12, 12), materials.stylus);
  arm.add(base, post, gimbal, tube, counterweight, headshell, needle, tip);

  group.add(plinth, deckShadow, platter, arm);

  const head = new Vector3();
  const back = new Vector3();
  const inward = new Vector3();
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
      gimbal.lookAt(head);
      back.subVectors(PIVOT, head).normalize();
      span(counterweight, PIVOT.clone().addScaledVector(back, 0.18), PIVOT.clone().addScaledVector(back, 0.42));
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
      materials.label.map = labelTexture;
      materials.label.needsUpdate = true;
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
