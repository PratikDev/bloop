"use client";

import { Button } from "@/components/ui/button";
import { continuousRule } from "@/lib/audio/mapping";
import { EARTH_PATHS } from "@/lib/earth/paths";
import { fireBrailleLine, fireDescription, firmsLine, fwiClassText, fwiLine, satText } from "@/lib/earth/fire-text";
import { fireProvenance } from "@/lib/earth/fire-provenance";
import { satelliteIn, sourceDataset } from "@/lib/earth/firms";
import { GEIGER_VOICE, geigerRate } from "@/lib/earth/geiger";
import { modalClass } from "@/lib/earth/class-grid";
import { cellIndex } from "@/lib/data/grid";
import { nextDay as nextDayOf } from "@/lib/earth/fwi";
import { dayCount, seriesOf } from "@/lib/earth/firms";
import { formatDay, formatFixed, formatInteger, formatUtc, type BoundT, type Lang } from "@/lib/i18n";
import type { WildfiresState } from "./use-wildfires";
import { useAppState, useT } from "../../AppState/use-app-state";
import { ChoiceGroup } from "../../ChoiceGroup";
import { HowWeGotThis } from "../../HowWeGotThis";
import { OnOffToggle } from "../../OnOffToggle";
import { StatusBadge } from "../../StatusBadge";
import { TranscriptLink } from "../../TranscriptLink";
import { RecordLetter } from "../../Art/Letter/RecordLetter"; // The letter on this record
import { fireLetter } from "@/lib/art/letter/data-records";
import { AgeNote } from "../AgeNote";
import { EarthMap } from "../EarthMap";
import { BrailleLine, DescribeButton, LinerNotes, TableToggle } from "../RecordTools";
import { usePlaceNames } from "../use-place-names";
import { DayPicker } from "../DayPicker";
import { FiresTable, PilotTable } from "./FireTables";
import { fireLinerNotes } from "./liner";
import { useWildfires } from "./use-wildfires";

/**
 * Fires and fire weather (P2c): one record, two sound layers. Tomorrow's fire weather (SVS 5315, an experimental model
 * forecast) is a fixed chord at the needle; FIRMS hotspots (a pixel holding one or more fires) are Geiger clicks for the
 * chosen box, sensor and day. NASA's SVS 5113 picture sits under them. "No calculation", "very low" and zero detections
 * are stated silences. The archive replay plays each stored forecast with the next day's FIRMS clicks over it.
 */
export function Wildfires() {
  const t = useT();
  const { state } = useAppState();
  const lang = state.lang;
  const w = useWildfires();
  const regionNames = usePlaceNames(w.regions);
  const needleName = usePlaceNames([w.needle]);
  if (w.error) return <StatusBadge kind="error">{t("official.error")}</StatusBadge>;
  if (!w.data || !w.daily || !w.reading || !w.source || !w.day) return <StatusBadge kind="loading">{t("official.loading")}</StatusBadge>;
  const { data, daily, reading } = w;
  const meta = data.fwi.meta;
  const place = needleName?.[0] ?? t("place.latlon", w.needle);
  const fwi = fwiLine(t, lang, meta, reading);
  const firms = firmsLine(t, lang, daily, reading);
  const rate = geigerRate(reading.count?.count ?? 0);
  const rule = continuousRule(GEIGER_VOICE);
  const chordSilent = w.chordTones().length === 0;
  const bdClass = modalClass(meta.grid, data.fwi.codes, daily.boxes.Bangladesh);
  const regionsText = regionNames ? w.regions.map((r, i) => t("earth.fire.region", { place: regionNames[i], cls: fwiClassText(t, meta, r.topClass) })).join("; ") : null;
  const pictureSat = satelliteIn(data.fires.datasets.map((d) => d.name).join(" "));
  const sensorLabel = (s: string) => t("data.text", { text: sourceDataset(daily, s as typeof w.source)?.name ?? s });
  const replayDay = w.sequence?.kind === "replay" && w.archive ? w.archive[w.sequence.step] : null;
  const season = w.sequence?.kind === "season" ? w.seasonCases.find((c) => c.key === (w.sequence?.kind === "season" ? w.sequence.key : "")) : null;

  return (
    <div data-provenance-group="" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]" data-testid="record-fires_fwi">
      <div className="space-y-3">
        <p className="text-body text-haze">{t("earth.fire.lead")}</p>
        <EarthMap
          testId="fire-map"
          image={EARTH_PATHS.firesImage}
          label={`${t("earth.fire.pictureAlt", { date: data.fires.frame_time_utc ? formatUtc(data.fires.frame_time_utc, lang) : t("hwgt.na") })} ${t("earth.map.needle", { place })}`}
          needle={w.needle}
          onMove={w.moveNeedle}
          boxes={daily.regions.map((r) => ({ id: r, box: daily.boxes[r], current: r === w.region }))}
        />
        <p className="text-small text-haze">
          {t("earth.fire.picture")} {pictureSat ? t("earth.fire.pictureSat", { sat: pictureSat }) : t("earth.fire.pictureSatNone")} {t("earth.map.keys")}
        </p>

        <div data-provenance-group="" className="space-y-2" data-testid="fire-readout">
          <p className="text-body" data-testid="fwi-line" data-fwi-code={reading.fwiCode}>
            {place}: {fwi}
          </p>
          <p className="text-body" data-testid="firms-line" data-count={reading.count?.count ?? ""}>
            {firms}
          </p>
          <p className="text-small text-haze">{t("earth.fire.fwiLabel")} {t("earth.fire.pixelNote")}</p>
          <p className="text-small text-haze" data-testid="geiger-scale">
            {t("earth.fire.scale", { cmin: formatInteger(rule.input.min, lang), cmax: formatInteger(rule.input.max, lang), min: formatFixed(rule.output.min, lang, 1), max: formatFixed(rule.output.max, lang, 0) })}{" "}
            {t("earth.fire.brightness")}
          </p>
          <BrailleLine line={fireBrailleLine(meta, daily, reading)} />
          <HowWeGotThis facts={fireProvenance(t, lang, data, reading, place)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge kind="note">{t("earth.fire.badge.chord", { state: !w.chordOn ? t("earth.badge.off") : chordSilent ? t("earth.badge.silent") : fwiClassText(t, meta, reading.fwiCode) })}</StatusBadge>
          <StatusBadge kind="note">{t("earth.fire.badge.clicks", { state: !w.clicksOn ? t("earth.badge.off") : rate === 0 ? t("earth.badge.silent") : t("earth.fire.badge.rate", { rate: formatFixed(rate, lang, 1) }) })}</StatusBadge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button className="h-11 rounded-full px-4 text-body" onClick={() => void (w.playing ? w.stop() : w.play())} data-testid="fire-play">
            {w.playing ? t("earth.stop") : t("earth.play")}
          </Button>
          <Button variant="outline" className="h-11 rounded-full px-4 text-body" onClick={() => void (w.sequence?.kind === "replay" ? w.stop() : w.startReplay())} data-testid="fire-replay">
            {w.sequence?.kind === "replay" ? t("earth.fire.replayStop") : t("earth.fire.replay")}
          </Button>
          <DescribeButton describe={(tt, l, level) => fireDescription(tt, l, meta, daily, reading, level, regionsText)} />
          <LinerNotes lines={fireLinerNotes(t, data)} />
        </div>
        {replayDay && (
          <p className="text-body text-moon" role="status" data-testid="replay-step">
            {t("earth.fire.replayStep", {
              i: formatInteger((w.sequence?.kind === "replay" ? w.sequence.step : 0) + 1, lang),
              n: formatInteger(w.archive?.length ?? 0, lang),
              issued: formatDay(replayDay.date, lang),
              forDay: formatDay(nextDayOf(replayDay.date), lang),
              cls: fwiClassText(t, meta, replayDay.codes[cellAt(meta.grid, w.needle)]),
              outcome: outcomeText(t, lang, w, replayDay.date),
            })}
          </p>
        )}
        {season && w.sequence?.kind === "season" && (
          <p className="text-body text-moon" role="status" data-testid="season-step">
            {t("earth.fire.seasonStep", { day: formatDay(season.series.days[w.sequence.step] ?? season.series.days[0], lang), count: formatInteger(season.series.counts[w.sequence.step] ?? 0, lang) })}
          </p>
        )}
        <TranscriptLink record="fires_fwi" label={t("earth.fire.title")} />
        <RecordLetter letter={fireLetter(t, meta, reading.fwiCode, reading.forDay, place)} />
      </div>

      <aside className="space-y-4">
        <ChoiceGroup label={t("earth.fire.box")} showLabel value={w.region} onChange={w.chooseRegion} className="flex-wrap"
          options={daily.regions.map((r) => ({ value: r, label: t("data.text", { text: r }) }))} />
        <ChoiceGroup label={t("earth.fire.sensor")} showLabel value={w.source} onChange={w.setSource} className="flex-wrap"
          options={daily.sources.map((s) => ({ value: s, label: satText(daily, s) }))} />
        <p className="text-small text-haze">{sensorLabel(w.source)}</p>
        <DayPicker label={t("earth.fire.day")} days={w.days} value={w.day} onChange={w.setDay} />
        <section className="space-y-1" aria-label={t("earth.fire.layers")}>
          <p className="text-small text-haze">{t("earth.fire.layers")}</p>
          <OnOffToggle label={t("earth.fire.layer.chord")} on={w.chordOn} onChange={w.setChordOn} />
          <OnOffToggle label={t("earth.fire.layer.clicks")} on={w.clicksOn} onChange={w.setClicksOn} />
        </section>
        <section className="space-y-2" data-testid="fire-regions">
          {bdClass !== null && <p className="text-body">{t("earth.fire.bdNow", { date: formatDay(reading.forDay, lang), cls: fwiClassText(t, meta, bdClass) })}</p>}
          <p className="text-small text-haze">{t("earth.fire.regionsLead")}</p>
          <div className="flex flex-wrap gap-2">
            {w.regions.map((r, i) => (
              <Button key={i} variant="outline" className="h-11 rounded-full px-4 text-body" onClick={() => w.moveNeedle({ lat: r.lat, lon: r.lon })} data-region={i}>
                {t("earth.fire.region", { place: regionNames?.[i] ?? t("place.latlon", r), cls: fwiClassText(t, meta, r.topClass) })}
              </Button>
            ))}
          </div>
        </section>
        {w.offSeason && (
          <section className="space-y-2" data-testid="fire-season">
            <p className="text-body">{t("earth.fire.offSeason", { day: formatDay(w.offSeason, lang) })}</p>
            {w.seasonCases.map((c) => (
              <Button key={c.key} variant="outline" className="h-auto min-h-11 rounded-full px-4 py-2 text-left text-body whitespace-normal" onClick={() => void (w.sequence?.kind === "season" && w.sequence.key === c.key ? w.stop() : w.startSeason(c.key))}>
                {w.sequence?.kind === "season" && w.sequence.key === c.key ? t("earth.fire.seasonStop") : t("earth.fire.season", { place: t("data.text", { text: "Chittagong Hill Tracts" }), sensor: c.sensor, year: c.year })}
              </Button>
            ))}
          </section>
        )}
        <AgeNote product={meta.product} sourceTime={meta.source_time_utc} />
        <AgeNote product={daily.product} sourceTime={daily.source_time_utc} />
        <AgeNote product={data.fires.product} sourceTime={data.fires.source_time_utc} />
        <TableToggle>
          <FiresTable w={w} />
        </TableToggle>
        <PilotTable w={w} />
      </aside>
    </div>
  );
}


const cellAt = (grid: { width: number; height: number }, at: { lat: number; lon: number }) => cellIndex(grid, at.lat, at.lon);

function outcomeText(t: BoundT, lang: Lang, w: WildfiresState, issued: string): string {
  if (!w.daily || !w.source) return t("earth.fire.outcomeNone");
  const series = seriesOf(w.daily, w.region, w.source);
  const c = series ? dayCount(series, nextDayOf(issued)) : null;
  return c ? t("earth.fire.outcome", { count: formatInteger(c.count, lang), box: t("data.text", { text: w.region }), sat: satText(w.daily, w.source) }) : t("earth.fire.outcomeNone");
}
