export interface ClassRumble {
  cutoffHz: number;
  gain: number;
  pulsesPerSecond: number;
}

export interface ClassState {
  code: number;
  label: string;
  sound: "silence" | "chord" | "rumble";
  tones?: number[];
  rumble?: ClassRumble;
  silence?: string;
}

export interface ClassesMapping {
  kind: "classes";
  input: { unit: string };
  rootHz?: number;
  states: ClassState[];
}
