"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLoaded } from "@/hooks/use-loaded";
import { ruleText, voiceSpec } from "@/lib/audio/mapping";
import type { LatLon } from "@/lib/data";
import { loadSst } from "@/lib/data/latest";
import { fetchJson } from "@/lib/data/fetch";
import { DATA_PATHS } from "@/lib/data/paths";
import { instrumentFor, RADAR_RECORD, RADAR_VOICE, radarNotes, radarPoints, turnSeconds, type MethodManifest, type RadarMode } from "@/lib/earth/radar";
import { radarProvenance } from "@/lib/earth/radar-provenance";
import { playRadar, stopRadar } from "@/lib/earth/sound/radar-player";
import { formatFixed, formatInteger, formatUtc } from "@/lib/i18n";
import { ruleTextBn } from "@/lib/i18n/bn/rules";
import { loadGeo } from "@/lib/geo/load";
import { useAppState, useT } from "../../AppState/use-app-state";
import { ChoiceGroup } from "../../ChoiceGroup";
import { HowWeGotThis } from "../../HowWeGotThis";
import { StatusBadge } from "../../StatusBadge";
import { TranscriptLink } from "../../TranscriptLink";
import { useRecordPlay } from "../use-record-play";

export { RADAR_RECORD } from "@/lib/earth/radar";
const MODES = ["nasa", "bloop"] as const;
const CENTRES = ["dhaka", "needle"] as const;
type Centre = (typeof CENTRES)[number];
const DHAKA = "Dhaka";

const loadMethod = async () => {
  const [manifest, sst, geo] = await Promise.all([fetchJson<MethodManifest>(DATA_PATHS.official(`${RADAR_RECORD}/manifest.json`)), loadSst(), loadGeo()]);
  const dhaka = geo.gazetteer.search(DHAKA, 1)[0];
  return { manifest, sst, dhaka: dhaka ? { lat: dhaka.lat, lon: dhaka.lon } : null };
};

/**
 * NASA's own method (P5): SVS 13786's radar sweep (Caldwell 73, SYSTEM Sounds) as "NASA mode" on today's ocean frame,
 * beside "Bloop mode" on the same points. A toggle switches them; the caption says the difference.
 */
export function RadarMethod() {
  const t = useT();
  const { state } = useAppState();
  const lang = state.lang;
  const { value, error } = useLoaded(loadMethod);
  const [mode, setMode] = useState<RadarMode>("nasa");
  const [centreChoice, setCentre] = useState<Centre>("dhaka");
  const play = useRecordPlay(stopRadar);
  const centre: LatLon | null = centreChoice === "needle" ? state.cursor : (value?.dhaka ?? null);
  const points = useMemo(() => (value && centre ? radarPoints(value.sst, centre) : []), [value, centre]);
  const speed = value?.manifest.analysis?.angular_speed_deg_s ?? null;
  const range = value?.sst.meta.value_range ?? null;
  const notes = useMemo(() => (speed !== null && range ? radarNotes(mode, points, speed, range) : []), [mode, points, speed, range]);
  const { stop } = play;
  useEffect(() => {
    if (!play.playing) return;
    const seconds = playRadar(mode, notes);
    const done = setTimeout(stop, (seconds + 1) * 1000);
    return () => clearTimeout(done);
  }, [play.playing, mode, notes, stop]);
  const switchMode = useCallback((m: RadarMode) => setMode(m), []);
  if (error) return <StatusBadge kind="error">{t("official.error")}</StatusBadge>;
  if (!value || speed === null || !range || !centre) return <StatusBadge kind="loading">{t("official.loading")}</StatusBadge>;
  const m = value.manifest;
  const rule = (id: string) => (lang === "bn" ? ruleTextBn(voiceSpec(id)) : ruleText(voiceSpec(id)));
  const centreName = centreChoice === "dhaka" ? t("earth.radar.dhaka") : t("place.latlon", centre);
  const r = voiceSpec(RADAR_VOICE).mapping;
  const maxKm = r?.kind === "continuous" ? r.input.max : 0;
  const counts = { glockenspiel: 0, marimba: 0, choir: 0 };
  for (const p of points) counts[instrumentFor(p.valueC, range)] += 1;
  return (
    <div data-provenance-group="" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]" data-testid={`record-${RADAR_RECORD}`}>
      <div className="space-y-3">
        <h3 className="text-lead font-medium">{t("earth.radar.title")}</h3>
        <p className="text-body text-haze">{t("earth.radar.lead")}</p>
        <p className="text-body font-medium text-moon" data-testid="radar-caption">
          {t("earth.radar.caption")}
        </p>
        <ChoiceGroup label={t("earth.radar.mode")} showLabel value={mode} onChange={switchMode} options={MODES.map((x) => ({ value: x, label: t(x === "nasa" ? "earth.radar.nasa" : "earth.radar.bloop") }))} />
        <p className="text-body" data-testid="radar-rule" data-mode={mode}>
          {t(mode === "nasa" ? "earth.radar.nasaRule" : "earth.radar.bloopRule")}
        </p>
        <p className="text-small text-haze">{mode === "nasa" ? rule(RADAR_VOICE) : rule("ocean")}</p>
        <svg role="img" aria-label={t("earth.radar.alt", { centre: centreName, n: formatInteger(points.length, lang) })} viewBox={`${-maxKm} ${-maxKm} ${2 * maxKm} ${2 * maxKm}`} className="mx-auto aspect-square w-full max-w-sm rounded-full ring-1 ring-glass-edge" data-testid="radar-plot" data-centre={`${centre.lat},${centre.lon}`}>
          {points.map((p, i) => {
            const inst = instrumentFor(p.valueC, range);
            return <circle key={i} cx={p.x} cy={p.y} r={maxKm / 60} className={inst === "glockenspiel" ? "fill-moon" : inst === "marimba" ? "fill-amber" : "fill-haze"} />;
          })}
          <circle cx={0} cy={0} r={maxKm / 40} className="fill-shapla" />
        </svg>
        <p className="text-small text-haze" data-testid="radar-points" data-n={points.length}>
          {t("earth.radar.points", { n: formatInteger(points.length, lang), time: formatUtc(value.sst.meta.frame_time_utc, lang), seconds: formatFixed(turnSeconds(speed), lang, 0) })}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button className="h-11 rounded-full px-4 text-body" data-testid="radar-play" onClick={() => void (play.playing ? play.stop() : play.play())}>
            {play.playing ? t("earth.radar.stop") : t("earth.radar.play", { mode: t(mode === "nasa" ? "earth.radar.nasa" : "earth.radar.bloop") })}
          </Button>
          <HowWeGotThis facts={radarProvenance(t, lang, m, value.sst.meta)} />
        </div>
        <TranscriptLink record={RADAR_RECORD} label={t("earth.radar.title")} />
      </div>
      <aside className="space-y-4">
        <ChoiceGroup label={t("earth.radar.centre")} showLabel value={centreChoice} onChange={setCentre} options={CENTRES.map((c) => ({ value: c, label: t(c === "dhaka" ? "earth.radar.dhaka" : "earth.radar.needle") }))} />
        <p className="text-small text-haze" data-testid="radar-classes" data-glock={counts.glockenspiel} data-marimba={counts.marimba} data-choir={counts.choir}>
          {m.description.split("||")[0].trim()}
        </p>
        <p className="text-body" data-testid="radar-credit">
          {t("earth.radar.credit", { credit: m.credit_line })}
        </p>
        <ul className="space-y-1 text-small">
          {m.svs_pages.map((href) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noreferrer" className="break-all text-moon underline underline-offset-2">
                {t("earth.radar.svs")}: {href}
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
