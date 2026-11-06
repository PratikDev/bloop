// Recorded narration (BUILD_PLAN §11.1 task 3, D12). Clips are fetched and
// decoded ahead of time by preloadClips() (L3 calls it at start-up: the only
// place L2 touches the network), then played through the narration bus with
// the sonification ducked, exactly like speech. A new clip interrupts the one
// before; Esc (stopAll) stops it and releases the duck.

import { emitCaption } from "./captions";
import { getCtx, getGraph, peekEngine } from "./context";
import { beginDuck } from "./duck";
import { currentEpoch, track } from "./sources";

export type ClipStatus = "loading" | "ready" | "failed";

// Before Start there is no AudioContext; decode with a tiny offline one (the
// source node resamples to the live context's rate when it plays).
const DECODE_SAMPLE_RATE = 48000;

const clips = new Map<string, Promise<AudioBuffer>>();
const status = new Map<string, ClipStatus>();
let current: AudioBufferSourceNode | null = null;
let token = 0; // the newest playClip() call; older ones that are still loading don't play

function decoder(): BaseAudioContext {
  return peekEngine()?.ctx ?? new OfflineAudioContext({ length: 1, sampleRate: DECODE_SAMPLE_RATE });
}

function load(url: string): Promise<AudioBuffer> {
  const cached = clips.get(url);
  if (cached) return cached;
  status.set(url, "loading");
  const loading = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.arrayBuffer();
    })
    .then((bytes) => decoder().decodeAudioData(bytes))
    .then((buffer) => {
      status.set(url, "ready");
      return buffer;
    })
    .catch((err: Error) => {
      clips.delete(url); // a later call may retry
      status.set(url, "failed");
      console.warn(`audio: clip ${url} could not be loaded (${err.message}).`);
      throw err;
    });
  clips.set(url, loading);
  return loading;
}

/** Fetches and decodes every clip now, so playClip() starts without delay. Never rejects. */
export async function preloadClips(urls: string[]): Promise<void> {
  await Promise.allSettled(urls.map(load));
}

/**
 * Plays a clip through the narration bus, ducking the sonification. Resolves
 * when it ends, is interrupted by a newer clip, or is stopped (Esc). A clip
 * that fails to load resolves silently (warned in the console).
 */
export async function playClip(url: string): Promise<void> {
  const mine = ++token;
  const epoch = currentEpoch();
  if (!clips.has(url)) console.warn(`audio: clip ${url} was not preloaded; loading it now.`);
  let buffer: AudioBuffer;
  try {
    buffer = await load(url);
  } catch {
    return;
  }
  // A newer clip, or Esc, came while this one was loading.
  if (mine !== token || epoch !== currentEpoch()) return;

  current?.stop();
  const ctx = getCtx();
  const source = track(new AudioBufferSourceNode(ctx, { buffer }));
  source.connect(getGraph().narration);
  current = source;

  await new Promise<void>((resolve) => {
    const release = beginDuck();
    source.addEventListener(
      "ended",
      () => {
        release();
        if (current === source) current = null;
        resolve();
      },
      { once: true },
    );
    emitCaption("caption.clip", { url });
    source.start();
  });
}

/** Dev harness only: where each clip stands. */
export function clipStatus(url: string): ClipStatus | null {
  return status.get(url) ?? null;
}
