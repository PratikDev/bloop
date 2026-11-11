import { onAnyAudioEvent } from "@/lib/audio-engines";
import { LANGS, type Lang } from "@/lib/i18n";
import { postCaption } from "@/lib/ui-captions";
import type { TimedPlayer } from "./tracks";
import { cueAt, cueData, cuesStarting, parseVtt, type Cue, type CueData, type VttKind } from "./vtt";

export interface TimedRun {
  player: TimedPlayer;
  stepSec: number;
  files: Record<Lang, Record<VttKind, string>>;
}

const CUE_CAPTION = "caption.cue";
const END_CAPTION = { sweep: "caption.sweep.end", timelapse: "caption.timelapse.end" } as const satisfies Record<TimedPlayer, string>;
const STOPPED = "caption.stopped";

interface Live extends TimedRun {
  cues: Record<Lang, { metadata: Cue[]; captions: Cue[] }>;
  last: number;
}

export type NowPlaying = Record<Lang, CueData | null>;

let live: Live | null = null;
let now: NowPlaying | null = null;
const listeners = new Set<() => void>();
let unsubscribe: (() => void) | null = null;

function setNow(next: NowPlaying | null) {
  now = next;
  for (const cb of listeners) cb();
}

function post(from: number, to: number) {
  if (!live) return;
  const [en, bn] = LANGS.map((lang) => cuesStarting(live!.cues[lang].captions, from, to));
  en.forEach((c, i) => postCaption(CUE_CAPTION, { en: c.text, bn: bn[i]?.text ?? c.text }));
}

function finish() {
  live = null;
  setNow(null);
}

function follow() {
  unsubscribe ??= onAnyAudioEvent((e) => {
    if (!live) return;
    if (e.kind === "step" && e.player === live.player) {
      const sec = e.index * live.stepSec;
      if (sec < live.last) live.last = -1;
      post(live.last, sec);
      live.last = sec;
      const at = (lang: Lang) => {
        const c = cueAt(live!.cues[lang].metadata, sec);
        return c && cueData(c);
      };
      setNow({ en: at("en"), bn: at("bn") });
    } else if (e.kind === "caption" && e.key === END_CAPTION[live.player]) {
      post(live.last, Number.POSITIVE_INFINITY);
      finish();
    } else if (e.kind === "caption" && e.key === STOPPED) {
      finish();
    }
  });
}

export function startTimedRun(run: TimedRun): void {
  const cues = Object.fromEntries(
    LANGS.map((lang) => [lang, { metadata: parseVtt(run.files[lang].metadata), captions: parseVtt(run.files[lang].captions) }]),
  ) as Live["cues"];
  live = { ...run, cues, last: -1 };
  follow();
  setNow(null);
}

export const nowPlaying = {
  get: (): NowPlaying | null => now,
  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};
