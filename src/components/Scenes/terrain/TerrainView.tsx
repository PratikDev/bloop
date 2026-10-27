"use client";

import { Target } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { mapContinuous, voiceSpec, withInputRange } from "@/lib/audio/mapping";
import { formatDegrees, formatFixed, formatInteger, formatTemperature, formatUtc, type Lang } from "@/lib/i18n";
import { useAppState } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { OnOffToggle } from "../../OnOffToggle";
import { DockButton } from "../../Turntable/DockButton";
import { ttFor, useTT } from "../../Turntable/i18n";
import { LabelLayer, type Rect } from "../../Turntable/LabelLayer";
import { labelCandidates } from "../../Turntable/labels";
import { useDetails } from "../../Turntable/NeedleChip/use-details";
import { SPEEDS } from "../../Turntable/use-turntable";
import { useSceneDebug } from "../debug";
import { rainCells } from "../rain-particles";
import { SceneCanvas } from "../SceneCanvas";
import { SceneShell } from "../SceneShell";
import { SceneChip } from "../SceneShell/SceneChip";
import { SceneBadge, SceneLegend } from "../SceneShell/SceneLegend";
import { Scrubber } from "../SceneShell/Scrubber";
import type { SceneProps } from "../types";
import { usePointerDrag } from "../use-pointer-drag";
import { useRainLoop } from "../use-rain-loop";
import { useSampled } from "../use-sampled";
import { useSceneTrack } from "../use-scene-track";
import { sstCell } from "./field";
import { KM_PER_DEGREE_C, type TerrainLayers } from "./terrain-scene";
import { sstTexture, type TerrainData } from "./use-terrain-data";
import { useTerrainScene } from "./use-terrain-scene";

const DEFAULT_SPEED = 2;
const ZOOM_STEP = 0.85;
const latText = (lat: number, lang: Lang) => `${formatDegrees(lat, lang)}° ${lat >= 0 ? "N" : "S"}`;
const lonText = (lon: number, lang: Lang) => `${formatDegrees(lon, lang)}° ${lon >= 0 ? "E" : "W"}`;

/** The ocean rule's own output range (mapping.json), for the zoomed-axis sentence. */
function oceanOutput(): { lo: number; hi: number } | null {
  const m = voiceSpec("ocean").mapping;
  return m?.kind === "continuous" ? { lo: m.output.min, hi: m.output.max } : null;
}

export function TerrainView({ data, onExit, tier, geo }: SceneProps & { data: TerrainData }) {
  const { state } = useAppState();
  const commands = useCommands();
  const { tt, lang } = useTT();
  const details = useDetails();
  const hostRef = useRef<HTMLDivElement>(null);
  const reserved = useRef<Rect[]>([]);
  const { field, relief, sst } = data;
  useSceneTrack("both");
  const [speedIndex, setSpeedIndex] = useState(DEFAULT_SPEED);
  const [raining, setRaining] = useState(!state.reduceMotion);
  const [hunting, setHunting] = useState(false);
  const [found, setFound] = useState(false);
  const [show, setShow] = useState<TerrainLayers>({ relief: true, rain: true, stars: true });
  const loop = useRainLoop(relief.plane.bounds, raining && !state.reduceMotion);
  const frame = loop.seq?.frames[loop.frame] ?? null;
  const rain = useMemo(
    () => (loop.seq && frame ? { cells: rainCells(loop.seq, frame, relief.plane), cellSize: 180 / loop.seq.size.height } : { cells: [], cellSize: 0.3 }),
    [loop.seq, frame, relief.plane],
  );
  const [sstImage] = useState(() => sstTexture(data.image));
  const ctl = useTerrainScene({
    field,
    relief,
    sstImage,
    sst,
    seq: loop.seq,
    frame,
    rain,
    decal: loop.decal,
    layers: show,
    speed: SPEEDS[speedIndex],
    reduceMotion: state.reduceMotion,
    hunting,
    onFound: () => setFound(true),
  });

  const here = useSampled(
    () => ({ at: ctl.walker(), value: ctl.value() }),
    (h) => `${h.at.lat.toFixed(2)},${h.at.lon.toFixed(2)},${h.value}`,
  );
  const axis = field.axis;
  const out = oceanOutput();
  const axisText = (l: Lang) => ttFor(l)("scenes.terrain.axis", { min: formatInteger(axis.min, l), max: formatInteger(axis.max, l) });
  const axisSpoken = (l: Lang) =>
    out ? ttFor(l)("scenes.terrain.axisSpoken", { min: formatInteger(axis.min, l), max: formatInteger(axis.max, l), lo: formatInteger(out.lo, l), hi: formatInteger(out.hi, l) }) : axisText(l);
  const valueLine = (l: Lang) =>
    here.value === null
      ? ttFor(l)("scenes.terrain.sayLand", { lat: latText(here.at.lat, l), lon: lonText(here.at.lon, l) })
      : ttFor(l)("scenes.terrain.say", { value: formatTemperature(here.value, l), lat: latText(here.at.lat, l), lon: lonText(here.at.lon, l) });

  // The hunt's answer, spoken on arrival (the grid's own warmest cell in the region).
  useEffect(() => {
    if (!found) return;
    const w = field.warmest;
    void commands.say((_, l) => ttFor(l)("scenes.terrain.found", { value: formatTemperature(w.valueC, l), lat: latText(w.lat, l), lon: lonText(w.lon, l) }));
  }, [found, field.warmest, commands]);

  const toggleHunt = () => {
    setFound(false);
    setHunting((h) => {
      if (!h) void commands.say((_, l) => `${ttFor(l)("scenes.terrain.goal")}. ${ttFor(l)("scenes.terrain.goalOn")}`);
      return !h;
    });
  };

  const labels = useMemo(() => (geo ? labelCandidates(geo.files, geo.gazetteer, lang).filter((c) => relief.plane.contains(c.lat, c.lon)) : []), [geo, lang, relief.plane]);
  const pointer = usePointerDrag(hostRef, { onDrag: (dx, dy) => ctl.orbit()?.drag(dx, dy), onZoom: (f) => ctl.orbit()?.zoom(f) });

  const onKey = (e: KeyboardEvent<HTMLElement>): boolean => {
    if (ctl.keyDown(e)) return true;
    switch (e.key) {
      case "Enter":
        details.show();
        void commands.say((_, l) => `${valueLine(l)} ${axisText(l)}.`);
        return true;
      case "g":
      case "G":
        toggleHunt();
        return true;
      case ",":
        loop.step(-1);
        return true;
      case ".":
        loop.step(1);
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

  useSceneDebug({
    id: "terrain",
    read: () => {
      const rule = voiceSpec("ocean").mapping;
      const at = ctl.walker();
      const value = ctl.value();
      return {
        lat: at.lat,
        lon: at.lon,
        cell: sstCell(sst, at.lat, at.lon),
        value,
        hz: rule?.kind === "continuous" ? mapContinuous(value, withInputRange(rule, axis)) : null,
        axisMin: axis.min,
        axisMax: axis.max,
        warmest: { ...field.warmest },
        regionMax: field.max,
        found,
        hunting,
      };
    },
    act: {
      place: (lat, lon) => ctl.placeWalker({ lat, lon }),
      hunt: () => toggleHunt(),
      speed: (i) => setSpeedIndex(i),
    },
  });
  const marker = here.value === null ? null : (here.value - axis.min) / (axis.max - axis.min);
  const per = `${formatInteger(KM_PER_DEGREE_C, lang)} km`;
  const zoomBadge = <SceneBadge>{axisText(lang)}</SceneBadge>;

  return (
    <SceneShell
      title={tt("scenes.terrain.title")}
      entry={`${tt("scenes.entry", { scene: tt("scenes.terrain.title"), how: tt("scenes.terrain.how") })} ${axisSpoken(lang)}`}
      onExit={onExit}
      onKey={onKey}
      onDetails={details.toggle}
      stage={
        <>
          <div ref={hostRef} {...pointer} className="absolute inset-0 touch-none select-none">
            <SceneCanvas tier={tier} label={tt("scenes.terrain.canvas")} build={ctl.build} onReady={() => undefined} />
          </div>
          <LabelLayer subscribe={ctl.bus.subscribe} candidates={labels} graticule={null} reserved={reserved} />
          <SceneChip
            subscribe={ctl.bus.subscribe}
            details={details}
            reserved={reserved}
            label={tt("turntable.details.open")}
            chip={
              <>
                <span className="shrink-0 font-display text-lead font-semibold whitespace-nowrap tabular-nums text-moon">
                  {here.value === null ? tt("scenes.terrain.land") : `${formatTemperature(here.value, lang)} ${tt("scenes.unit.celsius")}`}
                </span>
                <span className="min-w-0 truncate text-haze">
                  · {latText(here.at.lat, lang)}, {lonText(here.at.lon, lang)}
                </span>
              </>
            }
            headline={
              <p className="font-display text-value leading-none font-semibold tabular-nums text-moon">
                {here.value === null ? <span className="text-title">{tt("scenes.terrain.land")}</span> : formatTemperature(here.value, lang)}
                {here.value !== null && <span className="text-lead font-medium"> {tt("scenes.unit.celsius")}</span>}
              </p>
            }
          >
            {zoomBadge}
            <p className="text-body text-haze">{axisSpoken(lang)}</p>
            <p className="border-t border-line pt-2 text-small text-haze">{sst.meta.source_dataset}</p>
            <p className="text-small text-haze">{tt("scenes.framePaired", { datetime: formatUtc(sst.meta.frame_time_utc, lang) })}</p>
            {frame && <p className="text-small text-haze">{tt("scenes.rainTime", { datetime: formatUtc(frame.ref.time_utc, lang) })}</p>}
            {found && <p className="text-body font-medium text-amber">{tt("scenes.terrain.found", { value: formatTemperature(field.warmest.valueC, lang), lat: latText(field.warmest.lat, lang), lon: lonText(field.warmest.lon, lang) })}</p>}
          </SceneChip>
        </>
      }
      topRight={<div className="glass-chip pointer-events-auto rounded-full px-3 py-2">{zoomBadge}</div>}
      controls={
        <div className="glass-chip space-y-1 rounded-2xl px-4 py-2">
          {hunting && <p className="text-center text-body text-moon">{found ? tt("scenes.terrain.found", { value: formatTemperature(field.warmest.valueC, lang), lat: latText(field.warmest.lat, lang), lon: lonText(field.warmest.lon, lang) }) : tt("scenes.terrain.goalOn")}</p>}
          {loop.seq && frame && (
            <Scrubber label={tt("scenes.scrub.rain")} valueText={formatUtc(frame.ref.time_utc, lang)} index={loop.frame} count={loop.seq.frames.length} onChange={loop.setFrame} />
          )}
        </div>
      }
      legend={
        <SceneLegend
          title={tt("scenes.terrain.legend")}
          minLabel={formatInteger(axis.min, lang)}
          maxLabel={`${formatInteger(axis.max, lang)} ${tt("scenes.unit.celsius")}`}
          stops={data.stops}
          marker={marker}
          badge={<SceneBadge>{tt("scenes.terrain.axis", { min: formatInteger(axis.min, lang), max: formatInteger(axis.max, lang) })}</SceneBadge>}
        />
      }
      disclosure={[
        tt("scenes.framePaired", { datetime: formatUtc(sst.meta.frame_time_utc, lang) }),
        tt("scenes.exaggerated", { text: tt("scenes.terrain.height", { per }) }),
        tt("scenes.terrain.land"),
        loop.seq?.index.credit ?? "",
      ].filter(Boolean)}
      dock={{
        playing: raining && !state.reduceMotion,
        onPlay: () => setRaining((r) => !r),
        speedText: `${tt("scenes.terrain.walk")} ${tt("scenes.speed", { speed: formatFixed(SPEEDS[speedIndex], lang, SPEEDS[speedIndex] < 1 ? 2 : 0) })}`,
        onSpeed: (step) => setSpeedIndex((i) => Math.min(SPEEDS.length - 1, Math.max(0, i + step))),
        extra: <DockButton icon={Target} label={tt("scenes.terrain.goal")} keys="G" pressed={hunting} onClick={toggleHunt} />,
      }}
      layers={
        <section className="space-y-2">
          <p className="text-body font-semibold text-moon">{tt("scenes.layers.heading")}</p>
          <div className="grid grid-cols-2 gap-2">
            <OnOffToggle label={tt("scenes.relief")} on={show.relief} onChange={(on) => setShow((s) => ({ ...s, relief: on }))} />
            <OnOffToggle label={tt("scenes.rainSheets")} on={show.rain} onChange={(on) => setShow((s) => ({ ...s, rain: on }))} />
            <OnOffToggle label={tt("scenes.stars")} on={show.stars} onChange={(on) => setShow((s) => ({ ...s, stars: on }))} />
          </div>
        </section>
      }
    />
  );
}
