// Plays a listener-test task's sound with the app's own engine and voices (mapping.json rules, nothing new).

import { audio } from "@/lib/audio-jukebox";
import type { PlayerHandle } from "@/lib/audio-jukebox/types";
import type { SoundPlan } from "@/lib/listen-test/tasks";

/** Two handles one after the other, as one handle (stopping it stops whichever is playing). */
function chain(first: PlayerHandle, next: () => PlayerHandle): PlayerHandle {
  let current = first;
  let stopped = false;
  const done = first.done.then(() => {
    if (stopped) return;
    current = next();
    return current.done;
  });
  return {
    stop() {
      stopped = true;
      current.stop();
    },
    done,
  };
}

export function playPlan(plan: SoundPlan): PlayerHandle {
  switch (plan.kind) {
    case "tones":
      return audio.playUnison({ frameC: plan.first, fileC: plan.second });
    case "duets":
      return chain(audio.playUnison(plan.first), () => audio.playUnison(plan.second));
    case "sweep":
      return audio.playSweep(plan.steps, { stepMs: plan.stepMs });
    case "decades":
      return audio.playCompare({ label: plan.labels[0], values: plan.first, voice: "heat" }, { label: plan.labels[1], values: plan.second, voice: "heat" }, "sequential");
  }
}

/** The intro's "low to high": the ocean voice's own legend. */
export const playScale = () => audio.playLegend("ocean");
