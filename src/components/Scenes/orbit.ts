// A damped orbit camera shared by the scenes: yaw/pitch/distance around a
// target, driven by pointer drags, the wheel and keys. Reduced motion: no
// easing, the camera goes straight to its target.

import { Vector3, type PerspectiveCamera } from "three";

export interface OrbitPose {
  yaw: number; // radians, 0 = camera on +z looking towards −z
  pitch: number; // radians above the horizon
  distance: number;
}

export interface OrbitLimits {
  minDistance: number;
  maxDistance: number;
  minPitch: number;
  maxPitch: number;
}

export interface Orbit {
  readonly target: Vector3;
  pose(): OrbitPose;
  /** Rotate by a pointer drag in CSS pixels. */
  drag(dx: number, dy: number): void;
  /** Rotate by angles (keys). */
  turn(dYaw: number, dPitch: number): void;
  zoom(factor: number): void;
  set(pose: Partial<OrbitPose>, instant?: boolean): void;
  update(dt: number, instant: boolean): void;
}

const DRAG_RAD_PER_PX = 0.005;
const EASE_PER_SEC = 8;

export function createOrbit(camera: PerspectiveCamera, start: OrbitPose, limits: OrbitLimits, target = new Vector3()): Orbit {
  const goal = { ...start };
  const now = { ...start };
  const clampPose = () => {
    goal.pitch = Math.min(limits.maxPitch, Math.max(limits.minPitch, goal.pitch));
    goal.distance = Math.min(limits.maxDistance, Math.max(limits.minDistance, goal.distance));
  };
  const apply = () => {
    const c = Math.cos(now.pitch);
    camera.position.set(target.x + Math.sin(now.yaw) * c * now.distance, target.y + Math.sin(now.pitch) * now.distance, target.z + Math.cos(now.yaw) * c * now.distance);
    camera.lookAt(target);
  };
  apply();
  return {
    target,
    pose: () => ({ ...now }),
    drag(dx, dy) {
      goal.yaw -= dx * DRAG_RAD_PER_PX;
      goal.pitch += dy * DRAG_RAD_PER_PX;
      clampPose();
    },
    turn(dYaw, dPitch) {
      goal.yaw += dYaw;
      goal.pitch += dPitch;
      clampPose();
    },
    zoom(factor) {
      goal.distance *= factor;
      clampPose();
    },
    set(pose, instant = false) {
      Object.assign(goal, pose);
      clampPose();
      if (instant) Object.assign(now, goal);
    },
    update(dt, instant) {
      const k = instant ? 1 : 1 - Math.exp(-EASE_PER_SEC * dt);
      now.yaw += (goal.yaw - now.yaw) * k;
      now.pitch += (goal.pitch - now.pitch) * k;
      now.distance += (goal.distance - now.distance) * k;
      apply();
    },
  };
}
