"use client";

import { useLoaded } from "@/hooks/use-loaded";
import { APP_VOICES } from "@/lib/audio/mapping";
import { loadGlobeDuet, loadRainPairs, loadSstPairs, loadTruthStats } from "@/lib/data";
import { formatDay, formatFixed, formatInteger, type BoundT, type Lang } from "@/lib/i18n";
import { useAppState, useT } from "../../AppState/use-app-state";
import { OneToOneChart } from "../../charts/OneToOneChart";
import { useLiveData } from "../../LiveData/use-live-data";
import { PLAYED_VOICES } from "../../panels/MappingPanel";
import { Evidence } from "./Evidence";
import { TranscriptLink } from "../../TranscriptLink";
import { LIVE_TITLE, type LiveTranscript } from "@/lib/transcript";

// The face of each How we know card: the evidence plot (or table) with its alt text and table, the
// key numbers and two or three plain sentences. The numbers: sst.json / rain.json `verified` (the rows of
// docs/official/VALIDATION_TABLE.md), the pair files, truth/stats.json (rho) and globe_duet.json. Never typed.

const f = (lang: Lang, v: number, d: number) => formatFixed(v, lang, d);

function Face({ numbers, explain, transcript, children }: { numbers: string; explain: string; transcript?: LiveTranscript; children: React.ReactNode }) {
  const t = useT();
  return (
    <div className="space-y-2">
      <p className="text-small text-moon" data-testid="card-numbers">
        {numbers}
      </p>
      {children}
      <p className="text-small text-haze" data-testid="card-explain">
        {explain}
      </p>
      {transcript && <TranscriptLink record={transcript} label={t(LIVE_TITLE[transcript])} />}
    </div>
  );
}

/** A dataset's name from a pair file's header (e.g. "MUR SST v4.1 (NASA/JPL PO.DAAC)"). */
const sourceName = (datasets: readonly { id: string; name: string }[], id: string) => datasets.find((d) => d.id === id)?.name ?? id;

const pairRows = (t: BoundT, lang: Lang, pairs: readonly { lat: number; lon: number; frame: number; file: number }[], d: number) =>
  pairs.map((p) => [f(lang, p.lat, 2), f(lang, p.lon, 2), f(lang, p.frame, d), f(lang, p.file, d)]);

export function OceanFace() {
  const { state } = useAppState();
  const t = useT();
  const lang = state.lang;
  const { sst } = useLiveData();
  const { value: pairs } = useLoaded(loadSstPairs);
  const { value: stats } = useLoaded(loadTruthStats);
  if (!sst || !pairs || !stats) return null;
  const v = sst.meta.verified;
  const n = formatInteger(pairs.pairs.length, lang);
  const rho = f(lang, stats.sst.spearman_rho, 3);
  return (
    <Face
      numbers={t("how.ocean.numbers", {
        median: f(lang, v.value, 2),
        p90: v.p90_abs_error_C === undefined ? t("how.notAvailable") : f(lang, v.p90_abs_error_C, 2),
        n: formatInteger(v.n_points, lang),
        rho,
        date: formatDay(pairs.check.date, lang),
        source: sourceName(pairs.datasets, "mur"),
      })}
      explain={t("how.ocean.explain", { n })}
      transcript="ocean"
    >
      <Evidence
        alt={t("how.ocean.alt", { n, rho, median: f(lang, pairs.check.median_abs, 2) })}
        table={{ caption: t("truth.ocean.heading"), columns: [t("how.col.lat"), t("how.col.lon"), t("how.col.frameC"), t("how.col.murC")], rows: pairRows(t, lang, pairs.pairs, 2) }}
      >
        <OneToOneChart points={pairs.pairs.map((p) => ({ x: p.file, y: p.frame }))} xLabel={t("how.col.murC")} yLabel={t("how.col.frameC")} lineLabel={t("how.oneToOne")} />
      </Evidence>
    </Face>
  );
}

export function RainFace() {
  const { state } = useAppState();
  const t = useT();
  const lang = state.lang;
  const { rain } = useLiveData();
  const { value: pairs } = useLoaded(loadRainPairs);
  const { value: stats } = useLoaded(loadTruthStats);
  if (!rain || !pairs || !stats) return null;
  const v = rain.meta.verified;
  const wet = pairs.pairs.filter((p) => p.kind === "rain");
  const rho = f(lang, stats.rain.spearman_rho, 3);
  return (
    <Face
      numbers={t("how.rain.numbers", {
        percent: formatInteger(v.approx_percent, lang),
        agree: v.agreement === undefined ? t("how.notAvailable") : formatInteger(v.agreement * 100, lang),
        n: formatInteger(v.n_points, lang),
        rho,
        date: formatDay(pairs.frame_time_utc.slice(0, 10), lang),
        source: sourceName(pairs.datasets, "imerg"),
      })}
      explain={t("how.rain.explain")}
      transcript="rain"
    >
      <Evidence
        alt={t("how.rain.alt", { n: formatInteger(wet.length, lang), rho })}
        table={{ caption: t("truth.rain.heading"), columns: [t("how.col.lat"), t("how.col.lon"), t("how.col.frameMmh"), t("how.col.imergMmh")], rows: pairRows(t, lang, wet, 2) }}
      >
        <OneToOneChart log points={wet.map((p) => ({ x: p.file, y: p.frame }))} xLabel={t("how.col.imergMmh")} yLabel={t("how.col.frameMmh")} lineLabel={t("how.oneToOne")} />
      </Evidence>
    </Face>
  );
}

export function RulesFace() {
  const { state } = useAppState();
  const t = useT();
  const played = APP_VOICES.filter((v) => PLAYED_VOICES.includes(v) && v.mapping !== null);
  return (
    <Face numbers={t("how.rules.numbers", { count: formatInteger(PLAYED_VOICES.length, state.lang) })} explain={t("how.rules.explain")}>
      <Evidence
        alt={t("how.rules.title")}
        table={{ caption: t("how.rules.title"), columns: [t("how.col.sound"), t("how.col.rule")], rows: played.map((v) => [t("mapping.voiceLabel", { voice: v }), t("mapping.rule", { voice: v })]) }}
      />
    </Face>
  );
}

export function GlobeFace() {
  const { state } = useAppState();
  const t = useT();
  const lang = state.lang;
  const { value: duet } = useLoaded(loadGlobeDuet);
  const { value: stats } = useLoaded(loadTruthStats);
  if (!duet || duet.status !== "ok" || !stats) return null;
  const s = duet.summary;
  const n = formatInteger(duet.pairs.length, lang);
  const rho = f(lang, stats.globe.spearman_rho, 3);
  return (
    <Face
      numbers={t("how.globe.numbers", {
        median: s.median_abs_difference_pct === undefined ? t("how.notAvailable") : f(lang, s.median_abs_difference_pct, 1),
        within: s.share_within_25_points === undefined ? t("how.notAvailable") : formatInteger(s.share_within_25_points * 100, lang),
        rho,
        n,
        source: duet.credit,
      })}
      explain={t("how.globe.explain")}
    >
      <Evidence
        alt={t("how.globe.alt", { n, rho })}
        table={{
          caption: t("how.globe.title"),
          columns: [t("how.col.date"), t("how.col.lat"), t("how.col.lon"), t("how.col.groundPct"), t("how.col.satellitePct")],
          rows: duet.pairs.map((p) => [formatDay(p.date, lang), f(lang, p.lat, 2), f(lang, p.lon, 2), f(lang, p.ground_pct, 1), f(lang, p.satellite_pct, 1)]),
        }}
      >
        <OneToOneChart points={duet.pairs.map((p) => ({ x: p.satellite_pct, y: p.ground_pct }))} xLabel={t("how.col.satellitePct")} yLabel={t("how.col.groundPct")} lineLabel={t("how.oneToOne")} />
      </Evidence>
    </Face>
  );
}
