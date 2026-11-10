"use client";

import { Button } from "@/components/ui/button";
import { continuousRule } from "@/lib/audio/mapping";
import { latestLine, LIGHTS_VOICE, lightsBrailleLine, lightsSatellite, lightsStepLine } from "@/lib/earth/nightlights";
import { lightsProvenance } from "@/lib/earth/lights-provenance";
import { formatDay, formatFixed, formatInteger } from "@/lib/i18n";
import { useAppState, useT } from "../../AppState/use-app-state";
import { ChoiceGroup } from "../../ChoiceGroup";
import { DataTable } from "../../EarthData/DataTable";
import { HowWeGotThis } from "../../HowWeGotThis";
import { StatusBadge } from "../../StatusBadge";
import { TranscriptLink } from "../../TranscriptLink";
import { RecordLetter } from "../../Art/Letter/RecordLetter"; // ART: the letter on this record
import { lightsLetter } from "@/lib/art/letter/data-records";
import { AgeNote } from "../AgeNote";
import { BrailleLine, DescribeButton, LinerNotes, TableToggle } from "../RecordTools";
import { lightsLinerNotes } from "./liner";
import { Timeline } from "./Timeline";
import { useNightLights } from "./use-night-lights";

const PCT = 100;

/**
 * Night lights by city (P4): Black Marble daily radiance, one note per night on a log scale; a cloud-masked night is a
 * rest said as "gap: cloud", never darkness; no blackout is ever claimed. Product and satellite from the file.
 */
export function NightLights() {
  const t = useT();
  const { state } = useAppState();
  const lang = state.lang;
  const n = useNightLights();
  if (n.error) return <StatusBadge kind="error">{t("official.error")}</StatusBadge>;
  if (!n.file || !n.city) return <StatusBadge kind="loading">{t("official.loading")}</StatusBadge>;
  const { file, city, steps } = n;
  const sat = lightsSatellite(file);
  const shown = n.step >= 0 ? n.step : steps.length - 1;
  const s = steps[shown];
  const gaps = steps.filter((x) => x.radiance === null).length;
  const rule = continuousRule(LIGHTS_VOICE);
  const cityName = t("data.text", { text: city });
  return (
    <div data-provenance-group="" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]" data-testid="record-nightlights_bm">
      <div className="space-y-3">
        <p className="text-body text-haze">{t("earth.lights.lead")}</p>
        <ChoiceGroup label={t("earth.lights.city")} showLabel value={city} onChange={n.choose} className="flex-wrap" options={n.cities.map((c) => ({ value: c, label: t("data.text", { text: c }) }))} />
        <Timeline steps={steps} current={n.step} range={rule.input} label={t("earth.lights.timeline", { city: cityName, n: formatInteger(steps.length, lang), gaps: formatInteger(gaps, lang) })} />
        <div data-provenance-group="" className="space-y-2" data-testid="lights-readout">
          <p className="text-body" data-testid="lights-line" data-step={shown} data-gap={s?.radiance === null ? "true" : "false"}>
            {n.step >= 0 && s ? t("earth.lights.step", { i: formatInteger(n.step + 1, lang), n: formatInteger(steps.length, lang), line: lightsStepLine(t, lang, file, city, s) }) : latestLine(t, lang, file, city)}
          </p>
          <p className="text-small text-moon">{t("earth.lights.label")}</p>
          <p className="text-small text-haze" data-testid="lights-product">
            {sat ? t("earth.lights.product", { product: file.short_name, variable: file.variable, sat }) : t("earth.lights.productNoSat", { product: file.short_name, variable: file.variable })}
          </p>
          {s && <BrailleLine line={lightsBrailleLine(city, s)} />}
          <HowWeGotThis facts={[lightsProvenance(t, lang, file, city)]} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="h-11 rounded-full px-4 text-body" data-testid="lights-play" onClick={() => void (n.playing ? n.stop() : n.play())}>
            {n.playing ? t("earth.lights.stop") : t("earth.lights.play")}
          </Button>
          <DescribeButton describe={(tt, l, level) => (level === "brief" ? latestLine(tt, l, file, city) : `${latestLine(tt, l, file, city)} ${tt("earth.lights.label")}`)} />
          <LinerNotes lines={lightsLinerNotes(t, file)} />
        </div>
        <p className="text-small text-haze">{t("earth.lights.events")}</p>
        <TranscriptLink record="nightlights_bm" label={t("earth.lights.title")} />
        <RecordLetter letter={s ? lightsLetter(t, file, city, s) : null} />
      </div>
      <aside className="space-y-4">
        <AgeNote product={file.product} sourceTime={file.source_time_utc} />
        <TableToggle>
          <DataTable
            testId="lights-table"
            className="max-h-96"
            caption={t("earth.lights.table.caption", { city: cityName })}
            columns={[t("earth.lights.table.day"), t("earth.lights.table.radiance", { unit: file.units }), t("earth.lights.table.valid")]}
            current={n.step >= 0 ? n.step : null}
            currentLabel={t("earth.lights.table.day")}
            rowKeys={steps.map((x) => x.day)}
            rows={steps.map((x) => [
              formatDay(x.day, lang),
              x.radiance === null ? t("earth.lights.table.gap") : formatFixed(x.radiance, lang, 1),
              `${formatInteger(x.validShare * PCT, lang)}%`,
            ])}
          />
        </TableToggle>
      </aside>
    </div>
  );
}
