"use client";

import { Download } from "lucide-react";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { mapVoice } from "@/lib/audio/mapping";
import { valueInFrame, wrapLon, type LatLon } from "@/lib/data";
import { formatFixed, formatMonth, formatRainRate, formatSigned, formatUtc, type Lang } from "@/lib/i18n";
import type { GraceBoxName } from "@/types/data-contract";
import { useAnnounce } from "../../Announcer/use-announcer";
import { useAppState } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { OnOffToggle } from "../../OnOffToggle";
import { DockButton } from "../../Turntable/DockButton";
import { ttFor, useTT, type TT } from "../../Turntable/i18n";
import { LabelLayer, type Rect } from "../../Turntable/LabelLayer";
import { labelCandidates } from "../../Turntable/labels";
import { useDetails } from "../../Turntable/NeedleChip/use-details";
import { SPEEDS } from "../../Turntable/use-turntable";
import { AnchorLabels } from "../AnchorLabels";
import { useSceneDebug } from "../debug";
import { rainCells } from "../rain-particles";
import { SceneCanvas } from "../SceneCanvas";
import { SceneShell } from "../SceneShell";
import { SceneChip } from "../SceneShell/SceneChip";
import { SceneLegend } from "../SceneShell/SceneLegend";
import { Scrubber } from "../SceneShell/Scrubber";
import { downloadTactileRecord, scaleTag } from "../tactile";
import type { SceneProps } from "../types";
import { usePointerDrag } from "../use-pointer-drag";
import { useRainLoop } from "../use-rain-loop";
import { RELIEF_EXAGGERATION } from "./delta-scene";
import { nearestRiver } from "./rivers";
import type { DeltaData, DeltaRiverName } from "./use-delta-data";
import { useDeltaScene } from "./use-delta-scene";
import { useDeltaSound } from "./use-delta-sound";

const START: LatLon = { lat: 23.81, lon: 90.41 };
const STEP_DEG = 0.1;
const BIG_STEP_DEG = 0.5;
const ZOOM_STEP = 0.85;
const DEFAULT_SPEED = 2;
const BOXES: readonly GraceBoxName[] = ["Bangladesh", "NW_India"];
const BOX_TEXT = { Bangladesh: "scenes.delta.bd", NW_India: "scenes.delta.nw" } as const;
const RIVER_TEXT = { Ganges: "scenes.delta.river.Ganges", Brahmaputra: "scenes.delta.river.Brahmaputra" } as const satisfies Record<DeltaRiverName, string>;
/** The water legend's ramp: dry ground to the water table's colour (decoration; the value is the level). */
const WATER_RAMP = [
  { at: 0, colour: "rgb(60 48 38)" },
  { at: 1, colour: "rgb(127 178 255)" },
];
const WASD: Record<string, [number, number]> = { w: [1, 0], s: [-1, 0], a: [0, -1], d: [0, 1], ArrowUp: [1, 0], ArrowDown: [-1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

const cmText = (v: number | null, lang: Lang) => (v === null ? "—" : formatSigned(v, lang, 2));
const riverName = (tt: TT, name: string) => (name in RIVER_TEXT ? tt(RIVER_TEXT[name as DeltaRiverName]) : name);
const degText = (v: number, lang: Lang) => formatFixed(v, lang, 1).replace(/[.,]0$/, "");

/** Semitones between two values on the water voice's rule (12 · log2 of the frequency ratio). */
function semitones(a: number, b: number): number | null {
  const fa = mapVoice("water", a);
  const fb = mapVoice("water", b);
  return fa && fb ? 12 * Math.log2(fb / fa) : null;
}

export function DeltaView({ data, onExit, tier, geo }: SceneProps & { data: DeltaData }) {
  const { state } = useAppState();
  const commands = useCommands();
  const { tt, lang } = useTT();
  const details = useDetails();
  const hostRef = useRef<HTMLDivElement>(null);
  const reserved = useRef<Rect[]>([]);
  const { grace, ensemble, scene } = data;
  const plane = scene.relief.plane;
  const months = grace.boxes.Bangladesh.months;
  const [needle, setNeedle] = useState<LatLon>(START);
  const [speedIndex, setSpeedIndex] = useState(DEFAULT_SPEED);
  const [show, setShow] = useState({ rivers: true, districts: true, rain: true, stars: true });
  const [month, setMonth] = useState(() => grace.boxes.Bangladesh.cm.findLastIndex((v) => v !== null));
  const loop = useRainLoop(plane.bounds, !state.reduceMotion, SPEEDS[speedIndex]);
  const frame = loop.seq?.frames[loop.frame] ?? null;

  const levels = useMemo(() => ({ Bangladesh: grace.boxes.Bangladesh.cm[month] ?? null, NW_India: grace.boxes.NW_India.cm[month] ?? null }), [grace, month]);
  const rain = useMemo(
    () => (loop.seq && frame ? { cells: rainCells(loop.seq, frame, plane), cellSize: 180 / loop.seq.size.height } : { cells: [], cellSize: 0.3 }),
    [loop.seq, frame, plane],
  );
  const rainHere = loop.seq && frame ? valueInFrame(loop.seq, frame, needle.lat, needle.lon) : null;
  const river = nearestRiver(needle, scene.rivers);
  const boxLabels = { Bangladesh: tt("scenes.delta.bd"), NW_India: tt("scenes.delta.nw") };
  const sound = useDeltaSound({ grace, needle, rain: rainHere, river, boxLabels, onMonth: setMonth });
  const ctl = useDeltaScene({ data: scene, needle, levels, rain, decal: show.rain ? loop.decal : null, layers: show, reduceMotion: state.reduceMotion });

  const labels = useMemo(() => (geo ? labelCandidates(geo.files, geo.gazetteer, lang).filter((c) => plane.contains(c.lat, c.lon)) : []), [geo, lang, plane]);
  const pointer = usePointerDrag(hostRef, {
    onDrag: (dx, dy) => ctl.orbit()?.drag(dx, dy),
    onZoom: (f) => ctl.orbit()?.zoom(f),
    onTap: (x, y) => {
      const host = hostRef.current;
      const at = host ? ctl.pick(x, y, host.clientWidth, host.clientHeight) : null;
      if (at) setNeedle(at);
    },
  });

  const rainText = (l: Lang) => {
    const tl = ttFor(l);
    if (!rainHere || rainHere.mmPerHour === null) return tl("scenes.delta.noRain");
    return rainHere.mmPerHour === 0 ? tl("scenes.delta.dry") : tl("scenes.delta.rainHere", { value: formatRainRate(rainHere.mmPerHour, l) });
  };
  const boxText = (l: Lang, name: GraceBoxName) => ttFor(l)("scenes.delta.water", { name: ttFor(l)(BOX_TEXT[name]), value: cmText(levels[name], l) });
  const speak = () => {
    details.show();
    void commands.say((_, l) => ttFor(l)("scenes.delta.say", { month: formatMonth(months[month], l), bd: boxText(l, "Bangladesh"), nw: boxText(l, "NW_India"), rain: rainText(l) }));
  };

  const move = (dLat: number, dLon: number) => {
    const [w, s, e, n] = plane.bounds;
    setNeedle((p) => ({ lat: Math.min(n, Math.max(s, p.lat + dLat)), lon: Math.min(e, Math.max(w, wrapLon(p.lon + dLon))) }));
  };
  const stepMonth = (d: number) => setMonth((m) => Math.min(months.length - 1, Math.max(0, m + d)));

  const onKey = (e: KeyboardEvent<HTMLElement>): boolean => {
    const dir = WASD[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (dir) {
      const step = e.shiftKey ? BIG_STEP_DEG : STEP_DEG;
      move(dir[0] * step, dir[1] * step);
      return true;
    }
    switch (e.key) {
      case "Enter":
        speak();
        return true;
      case ",":
      case "<":
        if (e.shiftKey) loop.step(-1);
        else stepMonth(-1);
        return true;
      case ".":
      case ">":
        if (e.shiftKey) loop.step(1);
        else stepMonth(1);
        return true;
      case "+":
      case "=":
        ctl.orbit()?.zoom(ZOOM_STEP);
        return true;
      case "-":
      case "_":
        ctl.orbit()?.zoom(1 / ZOOM_STEP);
        return true;
      default:
        return false;
    }
  };

  const bdBox = grace.boxes.Bangladesh;
  const nwBox = grace.boxes.NW_India;
  const stBd = semitones(bdBox.mean_A, bdBox.mean_B);
  const stNw = semitones(nwBox.mean_A, nwBox.mean_B);
  const boxLine = (name: GraceBoxName) => {
    const [lon0, lat0, lon1, lat1] = grace.boxes[name].box_lon_lat;
    return tt("scenes.delta.box", { name: tt(BOX_TEXT[name]), lon0: degText(lon0, lang), lon1: degText(lon1, lang), lat0: degText(lat0, lang), lat1: degText(lat1, lang) });
  };
  const announce = useAnnounce();
  /** Bonus (3D-4): both GRACE boxes as two ridges on one disc, the shared fixed scale; ticks every ten years. */
  const exportTactile = () => {
    const first = months[0];
    const last = months[months.length - 1];
    const ticks = months.flatMap((m, i) => (m.endsWith("-01") && Number(m.slice(0, 4)) % 10 === 0 ? [i / months.length] : []));
    const file = `tactile-record_grace-bd-nw_${first}_${last}_${scaleTag(scene.range, "cm")}.stl`;
    downloadTactileRecord(
      {
        tracks: [
          { values: grace.boxes.Bangladesh.cm, inner: 30, outer: 40 },
          { values: grace.boxes.NW_India.cm, inner: 42, outer: 52 },
        ],
        range: scene.range,
        ticks,
        label: `${grace.dataset.split(" (")[0]}
${first.slice(0, 4)}-${last.slice(0, 4)}  inner: BD, outer: NW India`,
      },
      file,
    );
    announce(tt("scenes.tactile.saved", { file }));
  };

  useSceneDebug({
    id: "delta",
    read: () => ({ month: months[month], bd: levels.Bangladesh, nw: levels.NW_India, rain: rainHere?.mmPerHour ?? null, river, stBd, stNw, playing: sound.playing }),
    act: {
      month: (i) => setMonth(i),
      needle: (lat, lon) => setNeedle({ lat, lon }),
      monthOf: (y, m) => months.indexOf(`${y}-${String(m).padStart(2, "0")}`),
    },
  });
  const levelAt = (v: number | null) => (v === null ? null : (v - scene.range.min) / (scene.range.max - scene.range.min));
  const inBd = (() => {
    const [w, s, e, n] = bdBox.box_lon_lat;
    return needle.lat >= s && needle.lat <= n && needle.lon >= w && needle.lon <= e;
  })();

  return (
    <SceneShell
      title={tt("scenes.delta.title")}
      entry={tt("scenes.entry", { scene: tt("scenes.delta.title"), how: tt("scenes.delta.how") })}
      onExit={onExit}
      onKey={onKey}
      onDetails={details.toggle}
      stage={
        <>
          <div ref={hostRef} {...pointer} className="absolute inset-0 touch-none select-none">
            <SceneCanvas tier={tier} label={tt("scenes.delta.canvas")} build={ctl.build} onReady={() => undefined} />
          </div>
          <LabelLayer subscribe={ctl.bus.subscribe} candidates={labels} graticule={null} reserved={reserved} />
          <AnchorLabels subscribe={ctl.bus.subscribe} labels={BOXES.map((b) => ({ key: b, text: boxText(lang, b) }))} />
          <SceneChip
            subscribe={ctl.bus.subscribe}
            details={details}
            reserved={reserved}
            label={tt("turntable.details.open")}
            chip={
              <>
                <span className="shrink-0 font-display text-lead font-semibold whitespace-nowrap tabular-nums text-moon">
                  {inBd ? boxText(lang, "Bangladesh") : rainText(lang)}
                </span>
                <span className="min-w-0 truncate text-haze">· {river ? riverName(tt, river) : formatMonth(months[month], lang)}</span>
              </>
            }
            headline={<p className="font-display text-title leading-tight font-semibold text-moon">{formatMonth(months[month], lang)}</p>}
          >
            {BOXES.map((b) => (
              <p key={b} className="text-body text-moon tabular-nums">
                {boxText(lang, b)}
                {levels[b] === null && <span className="block text-small text-haze">{tt("scenes.delta.gap")}</span>}
              </p>
            ))}
            {!inBd && <p className="text-small text-haze">{tt("scenes.delta.outside", { name: tt("scenes.delta.bd") })}</p>}
            <p className="text-body text-moon">{rainText(lang)}</p>
            {frame && <p className="text-small text-haze">{tt("scenes.rainTime", { datetime: formatUtc(frame.ref.time_utc, lang) })}</p>}
            {river && <p className="text-body text-moon">{tt("scenes.delta.river", { name: riverName(tt, river) })}</p>}
            {stBd !== null && stNw !== null && (
              <p className="border-t border-line pt-2 text-small text-haze">
                {tt("scenes.delta.semitones", { bd: formatFixed(Math.abs(stBd), lang, 2), nw: formatFixed(Math.abs(stNw), lang, 2), ratio: formatFixed(stNw / stBd, lang, 1) })}
              </p>
            )}
            <p className="text-small text-haze">{grace.dataset}</p>
            <p className="text-small text-haze">{grace.gap_note}</p>
            <p className="text-small text-haze">{tt("scenes.delta.noMeghna")}</p>
          </SceneChip>
        </>
      }
      controls={
        <div className="glass-chip space-y-2 rounded-2xl px-4 py-2">
          <Scrubber label={tt("scenes.delta.month")} valueText={formatMonth(months[month], lang)} index={month} count={months.length} onChange={setMonth} />
          {loop.seq && frame && (
            <Scrubber label={tt("scenes.scrub.rain")} valueText={formatUtc(frame.ref.time_utc, lang)} index={loop.frame} count={loop.seq.frames.length} onChange={loop.setFrame} />
          )}
        </div>
      }
      legend={
        <SceneLegend
          title={tt("scenes.delta.waterLegend")}
          minLabel={formatSigned(scene.range.min, lang, 0)}
          maxLabel={formatSigned(scene.range.max, lang, 0)}
          stops={WATER_RAMP}
          ticks={[levelAt(0) ?? 0]}
          marker={levelAt(sound.playingBox === "NW_India" ? levels.NW_India : levels.Bangladesh)}
        />
      }
      disclosure={[
        boxLine("Bangladesh"),
        boxLine("NW_India"),
        tt("scenes.delta.resolution", { text: ensemble.voices.water.resolution }),
        tt("scenes.delta.scale", { min: formatSigned(scene.range.min, lang, 0), max: formatSigned(scene.range.max, lang, 0) }),
        tt("scenes.exaggerated", { text: `×${RELIEF_EXAGGERATION}` }),
        tt("scenes.context"),
      ]}
      dock={{
        playing: sound.playing,
        onPlay: sound.toggle,
        speedText: tt("scenes.speed", { speed: formatFixed(SPEEDS[speedIndex], lang, SPEEDS[speedIndex] < 1 ? 2 : 0) }),
        onSpeed: (step) => setSpeedIndex((i) => Math.min(SPEEDS.length - 1, Math.max(0, i + step))),
        extra: <DockButton icon={Download} label={tt("scenes.tactile")} onClick={exportTactile} />,
      }}
      layers={
        <section className="space-y-2">
          <p className="text-body font-semibold text-moon">{tt("scenes.layers.heading")}</p>
          <div className="grid grid-cols-2 gap-2">
            <OnOffToggle label={tt("scenes.delta.show.rivers")} on={show.rivers} onChange={(on) => setShow((s) => ({ ...s, rivers: on }))} />
            <OnOffToggle label={tt("scenes.delta.show.districts")} on={show.districts} onChange={(on) => setShow((s) => ({ ...s, districts: on }))} />
            <OnOffToggle label={tt("scenes.rainSheets")} on={show.rain} onChange={(on) => setShow((s) => ({ ...s, rain: on }))} />
            <OnOffToggle label={tt("scenes.stars")} on={show.stars} onChange={(on) => setShow((s) => ({ ...s, stars: on }))} />
          </div>
        </section>
      }
    />
  );
}
