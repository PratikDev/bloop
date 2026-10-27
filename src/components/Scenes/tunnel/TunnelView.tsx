"use client";

import { CalendarClock } from "lucide-react";
import { Download } from "lucide-react";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { formatFixed, formatInteger, formatSignedUpTo, type Lang } from "@/lib/i18n";
import { useAnnounce } from "../../Announcer/use-announcer";
import { useAppState } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { OnOffToggle } from "../../OnOffToggle";
import { DockButton } from "../../Turntable/DockButton";
import { ttFor, useTT } from "../../Turntable/i18n";
import { useDetails } from "../../Turntable/NeedleChip/use-details";
import { AnchorLabels } from "../AnchorLabels";
import { DIVERGING, legendStops } from "../colormaps";
import { useSceneDebug } from "../debug";
import { SceneCanvas } from "../SceneCanvas";
import { SceneShell } from "../SceneShell";
import { SceneChip } from "../SceneShell/SceneChip";
import { SceneLegend } from "../SceneShell/SceneLegend";
import { Scrubber } from "../SceneShell/Scrubber";
import { downloadTactileRecord, scaleTag } from "../tactile";
import type { SceneProps } from "../types";
import { useSampled } from "../use-sampled";
import { BEAD_RADIUS_PER_SQRT_MM } from "./tunnel-scene";
import { useTunnel, YEARS_PER_SEC } from "./use-tunnel";
import type { TunnelData } from "./use-tunnel-data";

/** The rings' colour scale: the Ghost Earths heat scale (blue lower, red higher), saturating at ±3 °C. */
const SCALE = { clamp: 3, colours: DIVERGING.blueRed };
const heatText = (v: number | null, lang: Lang) => (v === null ? "—" : formatSignedUpTo(v, lang, 3));

export function TunnelView({ data, onExit, tier }: SceneProps & { data: TunnelData }) {
  const { state } = useAppState();
  const commands = useCommands();
  const { tt, lang } = useTT();
  const details = useDetails();
  const { rows, demo, gistemp, gpcp } = data;
  const [stars, setStars] = useState(true);
  const windows = useMemo(
    () =>
      [demo.heat.A, demo.heat.B].map((w) => ({ key: `${w.window[0]}–${w.window[1]}`, from: w.window[0], to: w.window[1] })),
    [demo],
  );
  const indexOf = (year: number) => rows.findIndex((r) => r.year === year);
  // Captions read exactly from the demo JSON: the heat result entering the recent window, the rain result after it.
  const captions = useMemo(() => {
    const m = new Map<number, string>();
    m.set(indexOf(demo.heat.A.window[0]), tt("scenes.tunnel.window", { label: windows[0].key }));
    m.set(indexOf(demo.heat.B.window[0]), demo.heat.caption);
    m.set(indexOf(demo.rain.gpcp.B.window[0]) + 4, demo.rain.caption);
    return m;
    // indexOf reads rows only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, rows, windows, tt]);
  const ctl = useTunnel({ rows, windows, scale: SCALE, captions, stars, reduceMotion: state.reduceMotion, onLand: onExit });
  const { ended } = ctl;
  useEffect(() => {
    if (ended) void commands.say((_, l) => ttFor(l)("scenes.tunnel.end"));
  }, [ended, commands]);
  const index = useSampled(() => Math.round(ctl.position()), String);
  const row = rows[index];
  const rainMonths = row.months.filter((v) => v !== null).length;
  const inWindow = windows.find((w) => row.year >= w.from && row.year <= w.to) ?? null;

  const rainLine = (l: Lang) => (rainMonths === 0 ? ttFor(l)("scenes.tunnel.noRain") : ttFor(l)("scenes.tunnel.rainMonths", { n: formatInteger(rainMonths, l) }));
  const speak = () => {
    details.show();
    void commands.say((_, l) => ttFor(l)("scenes.tunnel.say", { year: String(row.year), heat: ttFor(l)("scenes.tunnel.heat", { value: heatText(row.heat, l) }), rain: rainLine(l) }));
  };

  const onKey = (e: KeyboardEvent<HTMLElement>): boolean => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        ctl.goTo(index + (e.shiftKey ? 10 : 1));
        return true;
      case "ArrowLeft":
      case "ArrowDown":
        ctl.goTo(index - (e.shiftKey ? 10 : 1));
        return true;
      case "1":
        ctl.goTo(indexOf(windows[0].from));
        return true;
      case "2":
        ctl.goTo(indexOf(windows[1].from));
        return true;
      case "Enter":
        speak();
        return true;
      default:
        return false;
    }
  };

  const announce = useAnnounce();
  /** Bonus (3D-4): the April–May anomaly per year as one ridge, on the rings' ±3 °C scale; ticks every ten years. */
  const exportTactile = () => {
    const range = { min: -SCALE.clamp, max: SCALE.clamp };
    const file = `tactile-record_dhaka-apr-may-heat_${rows[0].year}-${rows[rows.length - 1].year}_${scaleTag(range, "C")}.stl`;
    downloadTactileRecord(
      {
        tracks: [{ values: rows.map((r) => r.heat), inner: 32, outer: 50 }],
        range,
        ticks: rows.flatMap((r, i) => (r.year % 10 === 0 ? [i / rows.length] : [])),
        label: `${gistemp.dataset.split(" (")[0]}, Dhaka
April-May anomaly ${rows[0].year}-${rows[rows.length - 1].year}`,
      },
      file,
    );
    announce(tt("scenes.tactile.saved", { file }));
  };

  useSceneDebug({
    id: "tunnel",
    read: () => ({ year: row.year, heat: row.heat, rainMonths, rings: rows.length, firstYear: rows[0].year, lastYear: rows[rows.length - 1].year, captions: [...captions.entries()].map(([i, text]) => [rows[i]?.year ?? null, text]) }),
    act: { go: (i) => ctl.goTo(i), year: (y) => ctl.goTo(indexOf(y)) },
  });
  const first = rows[0].year;
  const last = rows[rows.length - 1].year;
  return (
    <SceneShell
      title={tt("scenes.tunnel.title")}
      entry={tt("scenes.entry", { scene: tt("scenes.tunnel.title"), how: tt("scenes.tunnel.how") })}
      onExit={onExit}
      onKey={onKey}
      onDetails={details.toggle}
      stage={
        <>
          <div className="absolute inset-0">
            <SceneCanvas tier={tier} label={tt("scenes.tunnel.canvas")} build={ctl.build} onReady={() => undefined} />
          </div>
          <AnchorLabels subscribe={ctl.bus.subscribe} labels={windows.map((w) => ({ key: w.key, text: tt("scenes.tunnel.window", { label: w.key }) }))} />
          <SceneChip
            subscribe={ctl.bus.subscribe}
            details={details}
            label={tt("turntable.details.open")}
            chip={
              <>
                <span className="shrink-0 font-display text-lead font-semibold whitespace-nowrap tabular-nums text-moon">{row.year}</span>
                <span className="min-w-0 truncate text-haze">· {tt("scenes.tunnel.heat", { value: heatText(row.heat, lang) })}</span>
              </>
            }
            headline={
              <p className="font-display text-value leading-none font-semibold tabular-nums text-moon">
                {heatText(row.heat, lang)}
                <span className="text-lead font-medium"> {tt("scenes.unit.celsius")}</span>
              </p>
            }
          >
            <p className="text-body font-medium text-moon">{row.year}</p>
            <p className="text-body text-moon">{rainLine(lang)}</p>
            {inWindow && <p className="text-body text-amber">{tt("scenes.tunnel.window", { label: inWindow.key })}</p>}
            <p className="border-t border-line pt-2 text-small text-haze">{demo.heat.dataset}</p>
            <p className="text-small text-haze">{gpcp.dataset}</p>
            <p className="text-small text-haze">{tt("scenes.tunnel.june")}</p>
          </SceneChip>
        </>
      }
      controls={
        <div className="glass-chip rounded-2xl px-4 py-2">
          <Scrubber label={tt("scenes.tunnel.year")} valueText={String(row.year)} index={index} count={rows.length} onChange={ctl.goTo} />
        </div>
      }
      legend={
        <SceneLegend
          title={demo.heat.dataset}
          minLabel={formatSignedUpTo(-SCALE.clamp, lang, 0)}
          maxLabel={`${formatSignedUpTo(SCALE.clamp, lang, 0)} ${tt("scenes.unit.celsius")}`}
          stops={legendStops(SCALE.colours)}
          ticks={[0.5]}
          marker={row.heat === null ? null : row.heat / SCALE.clamp / 2 + 0.5}
        />
      }
      disclosure={[
        tt("scenes.tunnel.rings", { n: formatInteger(rows.length, lang), from: String(first), to: String(last) }),
        gistemp.dataset,
        `${gpcp.dataset}. ${gpcp.caveat ?? ""}`.trim(),
        tt("scenes.tunnel.beads", { per: formatFixed(BEAD_RADIUS_PER_SQRT_MM, lang, 3) }),
        tt("scenes.tunnel.credit"),
        tt("scenes.context"),
      ]}
      dock={{
        playing: ctl.playing,
        onPlay: ctl.toggle,
        speedText: tt("scenes.tunnel.speed", { speed: formatFixed(YEARS_PER_SEC[ctl.speedIndex], lang, 1) }),
        onSpeed: (step) => ctl.setSpeedIndex(Math.min(YEARS_PER_SEC.length - 1, Math.max(0, ctl.speedIndex + step))),
        extra: (
          <>
            {windows.map((w, i) => (
              <DockButton key={w.key} icon={CalendarClock} label={tt("scenes.tunnel.jump", { label: w.key })} keys={String(i + 1)} onClick={() => ctl.goTo(indexOf(w.from))} />
            ))}
            <DockButton icon={Download} label={tt("scenes.tactile")} onClick={exportTactile} />
          </>
        ),
      }}
      layers={
        <section className="space-y-2">
          <p className="text-body font-semibold text-moon">{tt("scenes.layers.heading")}</p>
          <OnOffToggle label={tt("scenes.stars")} on={stars} onChange={setStars} />
        </section>
      }
    />
  );
}
