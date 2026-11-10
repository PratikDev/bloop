"use client";

import { useRef, type CSSProperties } from "react";
import { useSpin } from "@/hooks/use-spin";
import { DATA_PATHS } from "@/lib/data";
import { captionText, formatUtc } from "@/lib/i18n";
import type { JukeboxRecord } from "@/lib/records";
import { upNext } from "@/lib/records";
import type { CaptionEvent } from "@/lib/ui-captions";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { FrameProgress } from "../Dock/FrameProgress";
import { Transport } from "../Dock/Transport";
import { CodeChip, RecordStrip } from "../Rack/RecordStrip";
import { useRecords } from "../Records/use-records";
import { useTimeLapse } from "../TimeLapse/use-time-lapse";
import { VinylMark } from "../VinylMark";

/** The record on its sleeve: the frame on screen, a record peeking out, and which frame it is. */
function SleeveArt({ code }: { code: string }) {
  const { state } = useAppState();
  const t = useT();
  const { current: frame } = useTimeLapse();
  const disc = useRef<SVGSVGElement>(null);
  useSpin(disc, state.soundOn && state.playing);
  const layers = frame?.image ? `url(${frame.image.src}), url(${DATA_PATHS.sstImage})` : `url(${DATA_PATHS.sstImage})`;
  const art: CSSProperties = { backgroundImage: layers, backgroundSize: "cover", backgroundPosition: `${((state.cursor.lon + 180) / 360) * 100}% 50%` };
  return (
    <div aria-hidden={!frame} className="relative mx-auto aspect-square w-full max-w-64">
      <VinylMark ref={disc} className="absolute top-3 -right-5 size-[85%]" />
      <div style={art} className="absolute inset-0 rounded-plate border-3 border-navy bg-paper shadow-[8px_8px_0_var(--navy)]" />
      {frame && (
        <p className="on-space absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-md px-2 py-1 text-small">
          <CodeChip code={code} />
          <span>
            {t("timelapse.frame", { index: frame.index + 1, total: frame.total })}, {formatUtc(frame.timeUtc, state.lang)} UTC
          </span>
        </p>
      )}
    </div>
  );
}

/** The last captions the engine emitted, the newest largest. Not a live region: the Announcer already speaks them. */
function Lyrics({ lines }: { lines: CaptionEvent[] }) {
  const { state } = useAppState();
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const newest = i === lines.length - 1;
        return (
          <p key={`${i}:${line.key}`} className={cn(newest ? "comic-box rounded-caption px-2 py-1 font-strip text-lyric" : "text-lead text-haze")}>
            {captionText(state.lang, line.key, line.params)}
          </p>
        );
      })}
    </div>
  );
}

/** The player sheet's contents: sleeve, title and source, frame progress, transport, captions as lyrics, and what comes next. */
export function NowPlaying({ current, lines, onPicked }: { current: JukeboxRecord; lines: CaptionEvent[]; onPicked: () => void }) {
  const t = useT();
  const { records, play } = useRecords();
  const { current: frame } = useTimeLapse();
  const next = upNext(records, current);

  return (
    <div className="space-y-6">
      <SleeveArt code={current.code} />
      <div>
        <p className="font-wide text-headline leading-tight text-moon">{current.title(t)}</p>
        <p className="text-body text-haze">{t(`records.source.${current.group}`)}</p>
      </div>
      {frame && <FrameProgress frame={frame} />}
      <div className="flex justify-center">
        <Transport />
      </div>
      {lines.length > 0 && <Lyrics lines={lines} />}
      {next.length > 0 && (
        <section className="space-y-2">
          <h3 className="eyebrow">{t("player.upNext")}</h3>
          {next.map((record) => (
            <RecordStrip
              key={record.code}
              record={record}
              chosen={false}
              onClick={() => {
                play(record);
                onPicked();
              }}
            />
          ))}
        </section>
      )}
    </div>
  );
}
