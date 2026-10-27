// Motion that never adds a second encoding: the groove (the needle's latitude),
// a fixed-size ripple in the frame's own pixel colour, raindrops / snowflakes
// at exactly the voice's drops per second, and a sparkle on the extreme cell.

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  Quaternion,
  RingGeometry,
  Vector3,
} from "three";
import type { Palette } from "@/lib/css-tokens";
import { parallel, pathsGeometry } from "./geometry";

const MAX_PARTICLES = 96;
const FALL_SEC = 0.5;
const FALL_HEIGHT = 0.32;
const RIPPLE_PERIOD_SEC = 1.6;
const RIPPLE_MAX_SCALE = 2.4;
const SPARKLE_SEC = 0.9;
const SPARKLE_POINTS = 24;
const GROOVE_RADIUS = 1.004;
/** Dot sizes in CSS pixels. */
const RAIN_PX = 4;
const SNOW_PX = 6;
const SPARKLE_PX = 7;

export type ParticleKind = "rain" | "snow";

export interface Effects {
  group: Group;
  /** The needle's latitude, drawn as a glowing ring that doesn't turn. */
  setGroove(lat: number): void;
  /** Where the needle touches (world space) and the surface normal there. */
  setNeedle(point: Vector3, normal: Vector3): void;
  /** Ripple colour (the frame pixel under the needle); null hides the ripple. */
  setRippleColor(rgb: [number, number, number] | null): void;
  /** Particles per second (the voice's own drops/s) and their kind; 0 = none. */
  setParticles(perSecond: number, kind: ParticleKind): void;
  sparkle(): void;
  /**
   * Advance by dt seconds; `zoom` (0..1, camera height) keeps the effects the same size on
   * screen at any zoom. Returns how many particles were spawned (for the debug count).
   */
  update(dt: number, zoom: number): number;
  setMotion(on: boolean): void;
  dispose(): void;
}

function dotTexture(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(255,255,255,0.6)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new CanvasTexture(c);
}

export function createEffects(palette: Palette): Effects {
  const group = new Group();
  const glow = new Color(palette.shapla);
  const dot = dotTexture();

  // A one-pixel line, so the groove stays thin at any zoom.
  const grooveMaterial = new LineBasicMaterial({ color: glow, transparent: true, opacity: 0.9, depthWrite: false });
  let grooveLat = Number.NaN;
  const groove = new LineSegments(new BufferGeometry(), grooveMaterial);
  groove.renderOrder = 4;

  const rippleMaterial = new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const ripple = new Mesh(new RingGeometry(0.018, 0.026, 48), rippleMaterial);
  ripple.renderOrder = 5;

  const particlePositions = new Float32Array(MAX_PARTICLES * 3);
  const particleGeometry = new BufferGeometry();
  particleGeometry.setAttribute("position", new BufferAttribute(particlePositions, 3));
  // Pixel-sized dots (no size attenuation), so drops look the same at any zoom.
  const particleMaterial = new PointsMaterial({ map: dot, size: RAIN_PX, sizeAttenuation: false, transparent: true, depthWrite: false, color: new Color(palette.moon) });
  const particles = new Points(particleGeometry, particleMaterial);
  particles.frustumCulled = false;
  particles.renderOrder = 6;
  const ages = new Float32Array(MAX_PARTICLES).fill(Infinity);
  const offsets = new Float32Array(MAX_PARTICLES * 2);

  const sparklePositions = new Float32Array(SPARKLE_POINTS * 3);
  const sparkleGeometry = new BufferGeometry();
  sparkleGeometry.setAttribute("position", new BufferAttribute(sparklePositions, 3));
  const sparkleMaterial = new PointsMaterial({ map: dot, size: SPARKLE_PX, sizeAttenuation: false, color: glow, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
  const sparkles = new Points(sparkleGeometry, sparkleMaterial);
  sparkles.frustumCulled = false;

  group.add(groove, ripple, particles, sparkles);

  const needlePoint = new Vector3(0, 0, 1);
  const needleNormal = new Vector3(0, 0, 1);
  const tangentA = new Vector3();
  const tangentB = new Vector3();
  const orient = new Quaternion();
  const scratch = new Vector3();
  let zoomNow = 1;
  let rippleClock = 0;
  let rate = 0;
  let kind: ParticleKind = "rain";
  let toSpawn = 0;
  let next = 0;
  let sparkleAge = Infinity;
  let motion = true;

  const updateTangents = () => {
    tangentA.set(0, 1, 0).cross(needleNormal);
    if (tangentA.lengthSq() < 1e-6) tangentA.set(1, 0, 0);
    tangentA.normalize();
    tangentB.copy(needleNormal).cross(tangentA).normalize();
  };

  return {
    group,
    setGroove(lat) {
      if (Math.abs(lat - grooveLat) < 0.02) return;
      grooveLat = lat;
      groove.geometry.dispose();
      groove.geometry = pathsGeometry([parallel(lat, 1)], GROOVE_RADIUS);
    },
    setNeedle(point, normal) {
      needlePoint.copy(point);
      needleNormal.copy(normal).normalize();
      updateTangents();
      ripple.position.copy(point).addScaledVector(needleNormal, 0.003);
      orient.setFromUnitVectors(new Vector3(0, 0, 1), needleNormal);
      ripple.quaternion.copy(orient);
    },
    setRippleColor(rgb) {
      ripple.visible = rgb !== null;
      if (rgb) rippleMaterial.color.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
    },
    setParticles(perSecond, k) {
      rate = Math.max(0, perSecond);
      if (k !== kind) {
        kind = k;
        particleMaterial.size = k === "snow" ? SNOW_PX : RAIN_PX;
      }
    },
    sparkle() {
      if (!motion) return;
      sparkleAge = 0;
      for (let i = 0; i < SPARKLE_POINTS; i++) {
        const a = (i / SPARKLE_POINTS) * Math.PI * 2;
        const r = (0.02 + (0.03 * ((i * 7) % 5)) / 5) * zoomNow;
        const p = needlePoint.clone().addScaledVector(tangentA, Math.cos(a) * r).addScaledVector(tangentB, Math.sin(a) * r).addScaledVector(needleNormal, 0.01);
        sparklePositions.set([p.x, p.y, p.z], i * 3);
      }
      sparkleGeometry.attributes.position.needsUpdate = true;
    },
    update(dt, zoom) {
      zoomNow = zoom;
      // Ripple: one fixed-size pulse per period (fixed on screen, whatever the zoom).
      rippleClock = (rippleClock + dt) % RIPPLE_PERIOD_SEC;
      const phase = rippleClock / RIPPLE_PERIOD_SEC;
      ripple.scale.setScalar(zoom * (motion ? 1 + (RIPPLE_MAX_SCALE - 1) * phase : 1.4));
      rippleMaterial.opacity = motion ? 0.9 * (1 - phase) : 0.8;

      // Particles: spawn at the voice's rate (deterministic spacing, so the count equals rate × time).
      let spawned = 0;
      if (motion && rate > 0) {
        toSpawn += rate * dt;
        while (toSpawn >= 1) {
          toSpawn -= 1;
          spawned++;
          const i = next;
          next = (next + 1) % MAX_PARTICLES;
          ages[i] = 0;
          offsets[i * 2] = (Math.random() - 0.5) * 0.06;
          offsets[i * 2 + 1] = (Math.random() - 0.5) * 0.06;
        }
      } else {
        toSpawn = 0;
      }
      for (let i = 0; i < MAX_PARTICLES; i++) {
        ages[i] += dt;
        const t = ages[i] / FALL_SEC;
        // Landed particles are parked inside the globe (hidden); falling ones drop along the normal.
        scratch.copy(needlePoint).addScaledVector(needleNormal, t < 1 ? FALL_HEIGHT * zoom * (1 - t) : -10);
        if (t < 1) {
          const drift = kind === "snow" ? Math.sin(ages[i] * 9 + i) * 0.01 : 0;
          scratch.addScaledVector(tangentA, (offsets[i * 2] + drift) * zoom).addScaledVector(tangentB, offsets[i * 2 + 1] * zoom);
        }
        particlePositions[i * 3] = scratch.x;
        particlePositions[i * 3 + 1] = scratch.y;
        particlePositions[i * 3 + 2] = scratch.z;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      sparkleAge += dt;
      sparkleMaterial.opacity = sparkleAge < SPARKLE_SEC ? 1 - sparkleAge / SPARKLE_SEC : 0;
      return spawned;
    },
    setMotion(on) {
      motion = on;
      particles.visible = on;
      if (!on) sparkleAge = Infinity;
    },
    dispose() {
      groove.geometry.dispose();
      for (const g of [ripple.geometry, particleGeometry, sparkleGeometry]) g.dispose();
      for (const m of [grooveMaterial, rippleMaterial, particleMaterial, sparkleMaterial]) m.dispose();
      dot.dispose();
    },
  };
}
