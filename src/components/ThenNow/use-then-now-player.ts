"use client";

import { useEffect } from "react";
import { usePlayhead } from "@/hooks/use-playhead";
import { useNarratedPlayer, type NarratedStep } from "@/hooks/use-narrated-player";
import { audio } from "@/lib/audio-adapter";
import type { ThenNowInput, ThenNowPart } from "@/lib/audio-adapter/types";
import { windowLabel, type YearlyPart } from "@/lib/then-now";
import type { StatTexts } from "@/lib/then-now-stats";
import { postCaption } from "@/lib/ui-captions";
import type { DhakaThenNowDemo } from "@/types/data-contract";
import { useAppState } from "../AppState/use-app-state";
import { useAnnounce } from "../Announcer/use-announcer";
import { captionLine } from "../CaptionBar/use-describe";

export type Part = Exclude<ThenNowPart, "all">;

/** "Play heat, rain and water": the parts in the order the engine plays them. */
const ALL_PARTS: readonly Part[] = ["heat", "monsoon", "water"];

const PART_OF_PLAYER: Record<string, Part> = {
  "thenNow.heat": "heat",
  "thenNow.monsoon": "monsoon",
  "thenNow.water": "water",
};

/** What Describe says before a part plays: its caption, which names both windows (and, for water, the silences). */
const partLine = (input: ThenNowInput, part: Part) => captionLine("caption.thenNow.caption", { text: input.captions[part] });

/** A part's statistics (stats.json), by part; null when the file is missing (then nothing is said, never a typed number). */
export type StatLines = (part: Part) => StatTexts | null;

const statCaption = (s: StatTexts) => ({ en: s.en, bn: s.bn });

/**
 * Play controls and playheads for Then vs Now. Returns which part is sounding
 * (so "Play all" can move the view along) and the data index at the playhead.
 * With Describe on, each part's description is said before it plays, never
 * over it ("Play all" then plays the parts one by one, each after its own).
 */
export function useThenNowPlayer(input: ThenNowInput | null, demo: DhakaThenNowDemo | null, stats: StatLines) {
  const player = useNarratedPlayer<Part>();
  const { state } = useAppState();
  const announce = useAnnounce();
  const thenNowHead = usePlayhead("thenNow.");
  const splitHead = usePlayhead("compare.split");
  const { narrating } = player;
  const end = narrating ? captionLine("caption.thenNow.end") : undefined;

  const partStep = (data: ThenNowInput, part: Part): NarratedStep<Part> => ({
    tag: part,
    lines: narrating ? [partLine(data, part), ...statLines(part)] : [],
    play: () => audio.playThenNow(data, part),
  });
  // Describe says the statistics right after the caption (mentor item 10).
  const statLines = (part: Part) => {
    const s = stats(part);
    return s ? [captionLine("caption.thenNow.stats", statCaption(s))] : [];
  };

  const headPart = player.active && thenNowHead ? (PART_OF_PLAYER[thenNowHead.player] ?? null) : null;
  // The narrated part leads (its description is being said before any step sounds).
  const soundingPart = player.active ? (player.tag ?? headPart) : null;

  // Without Describe, a part that starts sounding shows its statistics in the caption bar and gives the live region
  // (and so a braille display) the short form. With Describe, its narrated lines already said them.
  useEffect(() => {
    if (!soundingPart || narrating) return;
    const s = stats(soundingPart);
    if (!s) return;
    postCaption("caption.thenNow.stats", statCaption(s));
    announce(state.lang === "bn" ? s.shortBn : s.shortEn);
    // Only when the sounding part changes: a language switch mid-part does not repeat it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundingPart]);

  return {
    playPart: (part: ThenNowPart) => {
      if (!input) return;
      if (part !== "all") void player.start({ steps: [partStep(input, part)], end });
      // Without Describe, the engine's own "all" keeps its exact timing between parts.
      else if (narrating) void player.start({ steps: ALL_PARTS.map((p) => partStep(input, p)), end });
      else void player.start({ steps: [{ lines: [], play: () => audio.playThenNow(input, "all") }] });
    },
    playSplit: (part: YearlyPart) => {
      if (!demo) return;
      const pair = part === "heat" ? demo.heat : demo.rain.gpcp;
      const a = { label: windowLabel(pair.A), values: pair.A.values, voice: part };
      const b = { label: windowLabel(pair.B), values: pair.B.values, voice: part };
      void player.start({
        steps: [
          {
            tag: part,
            lines: narrating ? [captionLine("caption.compare.useHeadphones", { a: a.label, b: b.label })] : [],
            play: () => audio.playCompare(a, b, "split"),
          },
        ],
      });
    },
    stop: player.stop,
    /** The part being described or sounding, while a Then vs Now player runs. */
    soundingPart,
    /** Index into the part's data (years A then B, or GRACE months). */
    index: headPart !== null && headPart === soundingPart ? (thenNowHead?.index ?? null) : null,
    /** Split playback: the same index plays in both windows at once. */
    splitIndex: player.active ? (splitHead?.index ?? null) : null,
  };
}
