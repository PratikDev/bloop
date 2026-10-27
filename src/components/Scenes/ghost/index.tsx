"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { audio } from "@/lib/audio-adapter";
import type { CompareSide, ContextVoice, PlayerHandle } from "@/lib/audio-adapter/types";
import { cellCentre } from "@/lib/data/global";
import { formatDegrees, formatFixed, formatSigned, type Lang } from "@/lib/i18n";
import type { GlobalLayerName } from "@/types/data-contract";
import { useAppState } from "../../AppState/use-app-state";
import { ChoiceGroup } from "../../ChoiceGroup";
import { useCommands } from "../../Commands/use-commands";
import { ARROWS } from "../../ExploreControls/use-map-keys";
import { OnOffToggle } from "../../OnOffToggle";
import { ttFor, useTT, type TT } from "../../Turntable/i18n";
import { LabelLayer, type Rect } from "../../Turntable/LabelLayer";
import { labelCandidates } from "../../Turntable/labels";
import { useDetails } from "../../Turntable/NeedleChip/use-details";
import { placeText } from "../../Turntable/place-text";
import { SearchBox } from "../../Turntable/SearchBox";
import { SPEEDS, ZOOM_DISTANCE } from "../../Turntable/use-turntable";
import { DIVERGING, legendStops } from "../colormaps";
import { useSceneDebug } from "../debug";
import { SceneCanvas } from "../SceneCanvas";
import { SceneShell } from "../SceneShell";
import { SceneChip } from "../SceneShell/SceneChip";
import { SceneBadge, SceneLegend } from "../SceneShell/SceneLegend";
import type { SceneProps } from "../types";
import { usePointerDrag } from "../use-pointer-drag";
import { useSampled } from "../use-sampled";
import { monthlyValues, placesMismatches, readGhost, yearlyValues, type GhostReading } from "./fields";
import type { ShellScale } from "./ghost-scene";
import { useGhostData } from "./use-ghost-data";
import { useGhostScene } from "./use-ghost-scene";

const LAYERS: readonly GlobalLayerName[] = ["heat", "rain", "water"];
/** Fixed, stated scales (docs/3d-scenes-1-plan.md): colour saturates at ±clamp; offset per unit of change. */
const SCALES: Record<GlobalLayerName, ShellScale> = {
  heat: { clamp: 3, offsetPerUnit: 0.02, colours: DIVERGING.blueRed },
  rain: { clamp: 3, offsetPerUnit: 0.02, colours: DIVERGING.brownTeal },
  water: { clamp: 60, offsetPerUnit: 0.0008, colours: DIVERGING.brownTeal },
};
const VOICE: Record<GlobalLayerName, ContextVoice> = { heat: "heat", rain: "monsoon", water: "water" };
const SCALE_TEXT = { heat: "scenes.ghost.scale.heat", rain: "scenes.ghost.scale.rain", water: "scenes.ghost.scale.water" } as const;
const LAYER_TEXT = { heat: "scenes.ghost.layer.heat", rain: "scenes.ghost.layer.rain", water: "scenes.ghost.layer.water" } as const;
const ZOOM_STEP = 0.85;
const DEFAULT_SPEED = 2;

const unitOf = (tt: TT, layer: GlobalLayerName) => (layer === "heat" ? tt("scenes.unit.celsius") : layer === "rain" ? tt("scenes.unit.mmDay") : tt("scenes.unit.cm"));
const fmt = (v: number | null, lang: Lang) => (v === null ? "—" : formatFixed(v, lang, 2));
const latText = (lat: number, lang: Lang) => `${formatDegrees(lat, lang)}° ${lat >= 0 ? "N" : "S"}`;
const lonText = (lon: number, lang: Lang) => `${formatDegrees(lon, lang)}° ${lon >= 0 ? "E" : "W"}`;

/** Scene 1 (book 3D-28): the then and now windows of the global history cube as two overlapping Earths. */
export function GhostEarths({ onExit, tier, geo }: SceneProps) {
  const { state } = useAppState();
  const commands = useCommands();
  const { tt, lang } = useTT();
  const [layer, setLayer] = useState<GlobalLayerName>("heat");
  const [show, setShow] = useState({ ghost: true, core: true, stars: true });
  const [spinning, setSpinning] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(DEFAULT_SPEED);
  const { files, field, error } = useGhostData(layer);
  const details = useDetails();
  const hostRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const reserved = useRef<Rect[]>([]);
  const player = useRef<PlayerHandle | null>(null);
  const scale = SCALES[layer];
  const ctl = useGhostScene({ field, scale, layers: show, spinning, speed: SPEEDS[speedIndex], reduceMotion: state.reduceMotion });

  const needle = useSampled(ctl.needle, (n) => `${n.lat.toFixed(1)},${n.lon.toFixed(1)}`);
  const reading: GhostReading | null = field ? readGhost(field, layer, files?.places ?? null, needle.lat, needle.lon) : null;
  const unit = unitOf(tt, layer);
  const windows = files?.windows[layer] ?? null;
  const centre = field && reading ? cellCentre(field.layer.meta, reading.cellId) : null;
  const where = (l: Lang) => {
    if (reading?.place) return reading.place.name;
    const w = geo?.gazetteer.whereAmI(needle);
    return w ? placeText(ttFor(l), l, w).line : `${latText(needle.lat, l)}, ${lonText(needle.lon, l)}`;
  };
  const confidence = layer === "rain" && reading && files ? (files.confidence.flags[String(reading.cellId)] ?? null) : null;
  const sameAs = reading?.place ? reading.place[`${layer}_same_record_as`] : null;
  const labels = useMemo(() => (geo ? labelCandidates(geo.files, geo.gazetteer, lang) : []), [geo, lang]);

  const pointer = usePointerDrag(hostRef, {
    onDrag: (dx, dy) => ctl.orbit()?.drag(dx, dy),
    onZoom: (f) => ctl.orbit()?.zoom(f),
  });

  /** Enter: speak then and now, then play window A and window B on the layer's then-vs-now voice. */
  const play = async () => {
    details.show();
    if (!reading || !windows || !field) return;
    player.current?.stop();
    const hollow = reading.then === null || reading.now === null;
    await commands.say((_, l) => {
      const tl = ttFor(l);
      if (hollow) return tl("scenes.ghost.sayHollow", { where: where(l) });
      return tl("scenes.ghost.say", {
        where: where(l),
        a: windows.A.label,
        then: fmt(reading.then, l),
        b: windows.B.label,
        now: fmt(reading.now, l),
        unit: unitOf(tl, layer),
        change: reading.change === null ? "—" : formatSigned(reading.change, l, 2),
      });
    });
    if (hollow) return;
    const side = (w: typeof windows.A): CompareSide => {
      if (layer !== "water") return { label: w.label, values: yearlyValues(field, reading.cellId, w), voice: VOICE[layer] };
      const run = monthlyValues(field, reading.cellId, w);
      return { label: w.label, values: run.values, months: run.months, voice: "water", gapTexture: true };
    };
    player.current = audio.playCompare(side(windows.A), side(windows.B), "sequential");
  };

  const turnBy = (dLat: number, dLon: number) => {
    const n = ctl.needle();
    setSpinning(false);
    ctl.lookAt({ lat: Math.max(-80, Math.min(80, n.lat + dLat)), lon: n.lon + dLon });
  };

  const onKey = (e: KeyboardEvent<HTMLElement>): boolean => {
    const arrow = ARROWS[e.key];
    if (arrow) {
      // One arrow = one grid cell of the record shown (2°, 2.5° or 3°).
      const meta = field?.layer.meta;
      const step = meta ? Math.abs(meta.grid.lat[0] - meta.grid.lat[1]) : 2;
      turnBy(arrow[0] * step * (e.shiftKey ? 5 : 1), arrow[1] * step * (e.shiftKey ? 5 : 1));
      return true;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= LAYERS.length) {
      setLayer(LAYERS[n - 1]);
      return true;
    }
    switch (e.key) {
      case "Enter":
        void play();
        return true;
      case "/":
        searchRef.current?.focus();
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

  const change = reading?.change ?? null;
  const values = reading && reading.then !== null && reading.now !== null;

  useSceneDebug({
    id: "ghost",
    read: () => ({ layer, cellId: reading?.cellId ?? null, then: reading?.then ?? null, now: reading?.now ?? null, change, place: reading?.place?.name ?? null, confidence }),
    act: {
      look: (lat, lon) => ctl.lookAt({ lat, lon }),
      layer: (i) => setLayer(LAYERS[i]),
      mismatches: () => (field && files ? placesMismatches(field, layer, files.places) : null),
    },
  });

  return (
    <SceneShell
      title={tt("scenes.ghost.title")}
      entry={tt("scenes.entry", { scene: tt("scenes.ghost.title"), how: tt("scenes.ghost.how") })}
      onExit={onExit}
      onKey={onKey}
      onDetails={details.toggle}
      stage={
        <>
          <div ref={hostRef} {...pointer} className="absolute inset-0 touch-none select-none">
            <SceneCanvas tier={tier} label={tt("scenes.ghost.canvas")} build={ctl.build} onReady={ctl.onReady} />
          </div>
          <LabelLayer subscribe={ctl.bus.subscribe} candidates={labels} graticule={null} reserved={reserved} />
          <SceneChip
            subscribe={ctl.bus.subscribe}
            details={details}
            reserved={reserved}
            label={tt("turntable.details.open")}
            chip={
              reading && (
                <>
                  <span className="shrink-0 font-display text-lead font-semibold whitespace-nowrap tabular-nums text-moon">
                    {values ? tt("scenes.ghost.values", { then: fmt(reading.then, lang), now: fmt(reading.now, lang), unit }) : tt("scenes.missing")}
                  </span>
                  <span className="min-w-0 truncate text-haze">· {where(lang)}</span>
                </>
              )
            }
            headline={
              <p className="font-display text-title leading-tight font-semibold tabular-nums text-moon">
                {values ? tt("scenes.ghost.change", { change: change === null ? "—" : formatSigned(change, lang, 2), unit }) : tt("scenes.ghost.hollow")}
              </p>
            }
          >
            {windows && reading && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-body">
                <dt className="text-haze">{windows.A.label}</dt>
                <dd className="text-moon tabular-nums">{fmt(reading.then, lang)} {unit}</dd>
                <dt className="text-haze">{windows.B.label}</dt>
                <dd className="text-moon tabular-nums">{fmt(reading.now, lang)} {unit}</dd>
              </dl>
            )}
            <p className="text-body font-medium text-moon">{where(lang)}</p>
            {reading?.place && <p className="text-body text-haze">{tt("scenes.ghost.place", { name: reading.place.name })}</p>}
            {sameAs && <p className="text-body text-haze">{tt("scenes.ghost.sameRecord", { name: sameAs })}</p>}
            {centre && <p className="text-body text-haze">{tt("scenes.ghost.cell", { lat: latText(centre.lat, lang), lon: lonText(centre.lon, lang) })}</p>}
            {confidence && <SceneBadge>{tt("scenes.ghost.confidence", { level: tt(`scenes.conf.${confidence}`) })}</SceneBadge>}
            {field && <p className="border-t border-line pt-2 text-small text-haze">{field.layer.meta.dataset}</p>}
            {files && <p className="text-small text-haze">{files.places.basis[layer]}</p>}
            <p className="text-small text-haze">{tt(layer === "water" ? "scenes.ghost.monthly" : "scenes.ghost.yearly")}</p>
          </SceneChip>
          {!field && <p className="absolute inset-x-0 top-1/2 text-center text-body text-haze">{tt(error ? "scenes.failed" : "scenes.loading")}</p>}
        </>
      }
      topRight={
        <>
          <ChoiceGroup<GlobalLayerName>
            label={tt("scenes.ghost.record")}
            value={layer}
            onChange={setLayer}
            options={LAYERS.map((l) => ({ value: l, label: tt(LAYER_TEXT[l]) }))}
            className="glass-chip pointer-events-auto rounded-full p-1"
            itemClassName="h-9 rounded-full px-3"
          />
          <SearchBox gazetteer={geo?.gazetteer ?? null} onChoose={(entry) => ctl.lookAt(entry, ZOOM_DISTANCE[entry.zoom] + 0.6)} inputRef={searchRef} className="pointer-events-auto" />
        </>
      }
      legend={
        windows && (
          <SceneLegend
            title={tt("scenes.ghost.legend", { a: windows.A.label, b: windows.B.label, unit })}
            minLabel={formatSigned(-scale.clamp, lang, 0)}
            maxLabel={formatSigned(scale.clamp, lang, 0)}
            stops={legendStops(scale.colours)}
            ticks={[0.5]}
            marker={change === null ? null : change / scale.clamp / 2 + 0.5}
            badge={confidence && <SceneBadge>{tt(`scenes.conf.${confidence}`)}</SceneBadge>}
          />
        )
      }
      disclosure={[
        tt("scenes.ghost.honesty"),
        ...(windows ? [tt("scenes.ghost.windows", { a: windows.A.label, b: windows.B.label })] : []),
        tt("scenes.exaggerated", { text: tt(SCALE_TEXT[layer]) }),
        tt("scenes.context"),
      ]}
      dock={{
        playing: spinning,
        onPlay: () => setSpinning((s) => !s),
        speedText: tt("scenes.speed", { speed: formatFixed(SPEEDS[speedIndex], lang, SPEEDS[speedIndex] < 1 ? 2 : 0) }),
        onSpeed: (step) => setSpeedIndex((i) => Math.min(SPEEDS.length - 1, Math.max(0, i + step))),
      }}
      layers={
        <section className="space-y-2">
          <p className="text-body font-semibold text-moon">{tt("scenes.layers.heading")}</p>
          <div className="grid grid-cols-2 gap-2">
            <OnOffToggle label={tt("scenes.ghost.show.ghost")} on={show.ghost} onChange={(on) => setShow((s) => ({ ...s, ghost: on }))} />
            <OnOffToggle label={tt("scenes.ghost.show.core")} on={show.core} onChange={(on) => setShow((s) => ({ ...s, core: on }))} />
            <OnOffToggle label={tt("scenes.stars")} on={show.stars} onChange={(on) => setShow((s) => ({ ...s, stars: on }))} />
          </div>
        </section>
      }
    />
  );
}
