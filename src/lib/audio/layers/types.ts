export type ValueTrust = "verified" | "stated" | "relative" | "pattern";

export type PlayMode = "single" | "both" | "duet";

export const DIAL_STOPS = [0, 0.5, 1] as const;
export type DialStop = (typeof DIAL_STOPS)[number];

export type ChordOwner = "user" | "dial";

export interface ChordRequest {
  recordId: string;
  playMode: PlayMode;
}

export type ChordBlock =
  | "pattern-only"
  | "not-allowlisted"
  | "both"
  | "duet"
  | "no-data"
  | "off";

export interface ChordGate {
  allowed: boolean;
  block: ChordBlock | null;
  modesOnly: boolean;
  trust: ValueTrust;
}

export interface ChordTone {
  value: number;
  hz: number;
  fraction: number;
  gain: number;
}

export interface ChordLayer {
  gate(req: ChordRequest): ChordGate;
  enable(req: ChordRequest, by: ChordOwner): ChordGate;
  disable(by: ChordOwner): void;
  stop(): void;
  sounding(): readonly ChordTone[];
}

export type ChordLayerHook = () => ChordLayer | null;

export const EARTH_CATEGORIES = ["ocean", "air", "land", "fire", "ice", "people"] as const;
export type EarthCategory = (typeof EARTH_CATEGORIES)[number];

export type InstrumentStyle = "orchestra" | "plain";

export interface OrchestraNote {
  hz: number;
  when: number;
  duration: number;
  gain: number;
}

export interface OrchestraNoteHandle {
  setHz(hz: number, at: number): void;
  stop(at?: number): void;
}

export interface OrchestraVoice {
  category: EarthCategory;
  note(ctx: BaseAudioContext, out: AudioNode, note: OrchestraNote): OrchestraNoteHandle;
}

export interface OrchestraApi {
  getCategory(recordId: string): EarthCategory | null;
  orchestraVoice(category: EarthCategory): OrchestraVoice;
}
