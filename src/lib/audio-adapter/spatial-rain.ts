// Spatial rain (Sound terrain, PROPOSAL): nearby rain cells as drop sources
// placed around the listener with HRTF panning. Each source plays the rain
// rule's own density (drops per second) and drop level; the panners have no
// distance roll-off, so position is direction only and loudness stays the
// data's. Routed through the rain bus, so the mixer's mute and solo apply.

import { voiceSpec } from "@/lib/audio/mapping";
import type { Graph } from "./graph";
import { addTask } from "./scheduler";
import type { SpatialListener, SpatialRainSource } from "./types";
import { createRainDropSound, dropInterval, dropRate } from "./voices/drops";

const MAX_SOURCES = 4;

interface Slot {
  panner: PannerNode;
  drop: (time: number, peak: number) => AudioBufferSourceNode;
  rate: number;
  peak: number;
  next: number;
}

export interface SpatialRain {
  set(sources: readonly SpatialRainSource[], listener: SpatialListener): void;
  silence(): void;
}

export function createSpatialRain(graph: Graph): SpatialRain {
  const { ctx } = graph;
  const spec = voiceSpec("rain");
  const attackSec = spec.sound.attackMs / 1000;
  const releaseSec = spec.sound.releaseMs / 1000;
  const slots: Slot[] = Array.from({ length: MAX_SOURCES }, () => {
    const panner = new PannerNode(ctx, { panningModel: "HRTF", distanceModel: "linear", rolloffFactor: 0 });
    panner.connect(graph.voiceBus.rain);
    return { panner, drop: createRainDropSound(graph, panner, attackSec, releaseSec), rate: 0, peak: 0, next: 0 };
  });

  addTask((until) => {
    for (const slot of slots) {
      if (slot.rate <= 0) continue;
      if (slot.next < ctx.currentTime) slot.next = ctx.currentTime + 0.01;
      while (slot.next < until) {
        slot.drop(slot.next, slot.peak);
        slot.next += dropInterval(slot.rate);
      }
    }
  });

  return {
    set(sources, listener) {
      const l = ctx.listener;
      const now = ctx.currentTime;
      l.positionX.setValueAtTime(listener.x, now);
      l.positionY.setValueAtTime(listener.y, now);
      l.positionZ.setValueAtTime(listener.z, now);
      l.forwardX.setValueAtTime(Math.sin(listener.yaw), now);
      l.forwardY.setValueAtTime(0, now);
      l.forwardZ.setValueAtTime(-Math.cos(listener.yaw), now);
      l.upX.setValueAtTime(0, now);
      l.upY.setValueAtTime(1, now);
      l.upZ.setValueAtTime(0, now);
      slots.forEach((slot, i) => {
        const s = sources[i];
        const { rate, peak } = dropRate("rain", s?.mmPerHour ?? null);
        slot.rate = rate;
        slot.peak = peak;
        if (!s) return;
        slot.panner.positionX.setValueAtTime(s.x, now);
        slot.panner.positionY.setValueAtTime(s.y, now);
        slot.panner.positionZ.setValueAtTime(s.z, now);
      });
    },
    silence() {
      for (const slot of slots) slot.rate = 0;
    },
  };
}
