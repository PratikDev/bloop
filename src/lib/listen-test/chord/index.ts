// The CV/ML build's two listener-test tasks, each its own module, registered in tasks.ts's one list:
//   chordVariety: "Which of these two views has more variety?" (2AFC; the answer is the larger P10–P90 spread);
//   chordGroups:  "Do you hear one group or two?" (the answer is the value chord's own group count, B1).
// PURE: every answer is computed from the shipped SST grid with the panel's and the chord's own functions.
import type { SstField } from "@/lib/data";
import type { ChordTone } from "@/lib/audio/layers/types";
import { groupsTask } from "./groups";
import { varietyTask } from "./variety";

export const CV_TASK_IDS = ["chordVariety", "chordGroups"] as const;
export type CvTaskId = (typeof CV_TASK_IDS)[number];
export type CvOptionId = "one" | "two";

/** A view as the variety task plays it: its 10th, 50th and 90th percentile, low to high, at the box's centre. */
export interface ViewSteps {
  lat: number;
  lon: number;
  values: [number, number, number];
}

export type CvSoundPlan = { kind: "views"; first: ViewSteps; second: ViewSteps; stepMs: number } | { kind: "chord"; tones: ChordTone[]; seconds: number };

export interface CvTaskInputs {
  /** Today's SST frame (latest/sst.bin). */
  sst: SstField | null;
  /** 0 or 1, drawn once per session: which box (one group or two) the groups task plays. */
  cvPick: 0 | 1;
}

/** The CV tasks a session gets (left out when today's data gives no clear answer). */
export const cvTasks = (inputs: Partial<CvTaskInputs>) => (inputs.sst ? [varietyTask(inputs.sst), groupsTask(inputs.sst, inputs.cvPick ?? 0)] : []);
