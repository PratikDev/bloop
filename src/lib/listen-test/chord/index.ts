import type { SstField } from "@/lib/data";
import type { ChordTone } from "@/lib/audio/layers/types";
import { groupsTask } from "./groups";
import { varietyTask } from "./variety";

export const CV_TASK_IDS = ["chordVariety", "chordGroups"] as const;
export type CvOptionId = "one" | "two";

export interface ViewSteps {
  lat: number;
  lon: number;
  values: [number, number, number];
}

export type CvSoundPlan = { kind: "views"; first: ViewSteps; second: ViewSteps; stepMs: number } | { kind: "chord"; tones: ChordTone[]; seconds: number };

export interface CvTaskInputs {
  sst: SstField | null;
  cvPick: 0 | 1;
}

export const cvTasks = (inputs: Partial<CvTaskInputs>) => (inputs.sst ? [varietyTask(inputs.sst), groupsTask(inputs.sst, inputs.cvPick ?? 0)] : []);
