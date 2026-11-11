import { audio } from "@/lib/audio-jukebox";
import type { PlayerHandle } from "@/lib/audio-jukebox/types";
import { silenceTones, soundTones } from "@/lib/audio/layers/chord/voice";
import { ensureAudioAll } from "@/lib/audio-engines";
import type { CvSoundPlan, ViewSteps } from ".";

const sweep = (v: ViewSteps, stepMs: number) =>
  audio.playSweep(v.values.map((valueC) => ({ lat: v.lat, lon: v.lon, valueC, mmPerHour: null, phase: "nodata" as const })), { stepMs });

function chord(tones: Parameters<typeof soundTones>[0], seconds: number): PlayerHandle {
  let stop = () => {};
  const done = ensureAudioAll().then(
    () =>
      new Promise<void>((resolve) => {
        soundTones(tones);
        const timer = setTimeout(() => (silenceTones(), resolve()), seconds * 1000);
        stop = () => {
          clearTimeout(timer);
          silenceTones();
          resolve();
        };
      }),
  );
  return { stop: () => stop(), done };
}

export function playCvPlan(plan: CvSoundPlan, chain: (first: PlayerHandle, next: () => PlayerHandle) => PlayerHandle): PlayerHandle {
  if (plan.kind === "views") return chain(sweep(plan.first, plan.stepMs), () => sweep(plan.second, plan.stepMs));
  return chord(plan.tones, plan.seconds);
}
