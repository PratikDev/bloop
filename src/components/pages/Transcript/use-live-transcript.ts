"use client";

import { useEffect, useMemo, useState } from "react";
import { useFreshness } from "@/hooks/use-freshness";
import { useLoaded } from "@/hooks/use-loaded";
import { followStorm, loadSequence, loadTruthStats, SWEEP_CENTER, sweepPath, type LiveFields } from "@/lib/data";
import { describeRecord } from "@/lib/describe/compose";
import { liveRainFrame, oceanFacts, rainFacts } from "@/lib/describe/facts";
import type { GeoData } from "@/lib/geo/load";
import { oceanCardProvenance, rainCardProvenance } from "@/lib/provenance/how";
import { sourceDataset } from "@/lib/provenance/live";
import type { Provenance } from "@/lib/provenance/types";
import { sweepTracks } from "@/lib/timed-text/sweep";
import { timelapseTracks } from "@/lib/timed-text/timelapse";
import type { LiveTranscript } from "@/lib/transcript";
import { useAppState, useT } from "../../AppState/use-app-state";
import { loadGeoSoon, placeNamers } from "../../Describe/place-namer";
import { useLiveData } from "../../LiveData/use-live-data";
import { buildTracks, type BuiltTracks } from "../../TimedText/build";
import { SWEEP_STEP_SEC, TIMELAPSE_STEP_SEC } from "../../TimedText/follow";

interface LiveTranscriptData {
  covers: string[];
  pattern: string[];
  meaning: string | null;
  built: BuiltTracks | null;
  builtError: boolean;
  provenance: Provenance | null;
  dataset: string | null;
}

async function soundTracks(record: LiveTranscript, fields: LiveFields): Promise<BuiltTracks> {
  if (record === "ocean") {
    const path = sweepPath(fields, SWEEP_CENTER);
    return buildTracks("sweep", (x) => sweepTracks({ ...path, center: SWEEP_CENTER, stepSec: SWEEP_STEP_SEC, track: "ocean" }, x));
  }
  const seq = await loadSequence();
  const frames = followStorm(seq);
  return buildTracks("timelapse", (x) => timelapseTracks({ frames, times: seq.frames.map((f) => f.ref.time_utc), stepSec: TIMELAPSE_STEP_SEC }, x));
}

export function useLiveTranscript(record: LiveTranscript): LiveTranscriptData | null {
  const { state } = useAppState();
  const t = useT();
  const { fields } = useLiveData();
  const freshness = useFreshness();
  const { value: stats } = useLoaded(loadTruthStats);
  const [geo, setGeo] = useState<GeoData | null | undefined>(undefined);
  const [built, setBuilt] = useState<{ record: LiveTranscript; tracks: BuiltTracks | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadGeoSoon().then((g) => !cancelled && setGeo(g));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!fields) return;
    let cancelled = false;
    soundTracks(record, fields).then(
      (tracks) => !cancelled && setBuilt({ record, tracks }),
      () => !cancelled && setBuilt({ record, tracks: null }),
    );
    return () => {
      cancelled = true;
    };
  }, [record, fields]);

  return useMemo(() => {
    if (!fields || geo === undefined) return null;
    const name = placeNamers(geo, state.lang).name;
    const facts = record === "ocean" ? oceanFacts(fields.sst, SWEEP_CENTER, name) : fields.rain ? rainFacts(liveRainFrame(fields.rain), SWEEP_CENTER, name, null) : null;
    const brief = facts ? describeRecord(facts, "brief", state.lang).data : [];
    const detailed = facts ? describeRecord(facts, "detailed", state.lang) : null;
    const c = { t, lang: state.lang, freshness, place: null };
    const meta = record === "ocean" ? fields.sst.meta : fields.rain?.meta;
    const mine = built?.record === record ? built : null;
    return {
      covers: brief,
      pattern: (detailed?.data ?? []).filter((s) => !brief.includes(s)),
      meaning: detailed?.meaning ?? null,
      built: mine?.tracks ?? null,
      builtError: mine !== null && mine.tracks === null,
      provenance: record === "ocean" ? oceanCardProvenance(c, fields.sst.meta, stats) : fields.rain ? rainCardProvenance(c, fields.rain.meta, stats) : null,
      dataset: meta ? (sourceDataset(freshness, record === "ocean" ? "sst" : "rain")?.name ?? meta.source_dataset) : null,
    };
  }, [record, fields, geo, state.lang, t, freshness, stats, built]);
}
