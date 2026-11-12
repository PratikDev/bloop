"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLoaded } from "@/hooks/use-loaded";
import { playSamples } from "@/lib/art/live/buffer";
import { artProvenance } from "@/lib/art/provenance";
import { loadRawFrame, loadRawPixel, type RawPixelFile } from "@/lib/art/raw-pixel/load";
import { RAW_RATE, renderBloop, renderNaive, type Frame } from "@/lib/art/raw-pixel/render";
import { useSoundStart } from "@/hooks/use-sound-start";
import type { PlayerHandle } from "@/lib/audio/types";
import { formatInteger, formatSignificant, formatUtc, type BoundT, type Lang } from "@/lib/i18n";
import { useAppState, useT } from "../AppState/use-app-state";
import { Tile } from "../pages/How/Tile";

const sig = (lang: Lang, v: number) => formatSignificant(v, lang, 3);

/** The stored measurement as the card says it (every number from raw_pixel.json). */
export function rawNumbers(t: BoundT, lang: Lang, f: RawPixelFile): string {
  return t("raw.numbers", {
    nf: sig(lang, f.naive.flatness),
    nr: sig(lang, f.naive.roughness),
    ne: sig(lang, f.naive.entropy),
    bf: sig(lang, f.bloop.flatness),
    br: sig(lang, f.bloop.roughness),
    be: sig(lang, f.bloop.entropy),
  });
}

/**
 * Raw-pixel vs Bloop (How we know): one frame, the naive pixel-hue scan and Bloop's rule, 6 s each, with their measured
 * flatness, roughness and entropy. The naive version is played only by its own button here, never anywhere else.
 */
export function RawPixelCard() {
  const { state } = useAppState();
  const t = useT();
  const soundStart = useSoundStart();
  const lang = state.lang;
  const { value: file } = useLoaded(loadRawPixel);
  const frame = useRef<Frame | null>(null);
  const player = useRef<PlayerHandle | null>(null);
  const [plays, setPlays] = useState({ naive: 0, bloop: 0 });

  async function play(which: "naive" | "bloop") {
    await soundStart();
    frame.current ??= await loadRawFrame();
    player.current?.stop();
    player.current = playSamples([which === "naive" ? renderNaive(frame.current) : renderBloop(frame.current)], RAW_RATE);
    setPlays((p) => ({ ...p, [which]: p[which] + 1 }));
  }

  const facts = file
    ? [
        artProvenance({
          subject: t("raw.hwgt.subject"),
          method: t("raw.hwgt.method"),
          dataset: file.record,
          window: formatUtc(file.time, lang),
          n: t("raw.hwgt.n", { naive: formatInteger(file.naive.frames, lang), bloop: formatInteger(file.bloop.frames, lang) }),
          scripts: ["scripts/art-raw-pixel.ts", "src/lib/art/raw-pixel/render.ts", "src/lib/art/raw-pixel/metrics.ts"],
          test: "src/lib/art/raw-pixel/raw-pixel.test.ts",
        }),
      ]
    : [];
  const controls = (
    <div className="space-y-2" data-testid="raw-pixel" data-naive-plays={plays.naive} data-bloop-plays={plays.bloop}>
      <p className="text-small text-moon">{t("raw.label")}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="h-11" onClick={() => void play("naive")}>
          {t("raw.naive")}
        </Button>
        <Button variant="outline" className="h-11" onClick={() => void play("bloop")}>
          {t("raw.bloop")}
        </Button>
        <Button variant="ghost" className="h-11" onClick={() => player.current?.stop()}>
          {t("raw.stop")}
        </Button>
      </div>
      {file && (
        <p className="text-small text-moon" data-testid="raw-numbers">
          {rawNumbers(t, lang, file)}
        </p>
      )}
      <p className="text-small text-haze">{t("raw.scale")}</p>
    </div>
  );
  return (
    <Tile
      title={t("raw.title")}
      figure={file ? t("raw.figure", { naive: sig(lang, file.naive.roughness), bloop: sig(lang, file.bloop.roughness) }) : undefined}
      figureLabel={t("raw.figureLabel")}
      face={
        <div className="space-y-2">
          <p className="text-small text-haze">{t("raw.explain")}</p>
          {controls}
        </div>
      }
      open={t("raw.open")}
      facts={facts}
    >
      <p className="text-body text-haze">{t("raw.explain")}</p>
    </Tile>
  );
}
