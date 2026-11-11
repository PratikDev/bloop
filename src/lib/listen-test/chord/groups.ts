// Task "chordGroups": one real box played as the value chord (B), either today's one-group box or its two-group box
// (drawn once per session); the answer is the chord's own group count (findModes, B1).
import { chordTones } from "@/lib/audio/layers/chord/tones";
import { chordPeak } from "@/lib/audio/layers/chord/voice";
import type { Task } from "../tasks";
import { boxViews } from "./views";

const SECONDS = 4;

export function groupsTask(sst: Parameters<typeof boxViews>[0], pick: 0 | 1): Task | null {
  const views = boxViews(sst);
  const one = views.find((v) => v.groups.length === 1);
  const two = views.find((v) => v.groups.length === 2);
  const v = pick === 1 ? (two ?? one) : (one ?? two);
  if (!v) return null;
  return {
    id: "chordGroups",
    params: { box: v.box.id },
    options: ["one", "two"],
    correct: v.groups.length === 2 ? "two" : "one",
    sound: { kind: "chord", tones: chordTones(v.groups, "ocean", chordPeak()), seconds: SECONDS },
  };
}
