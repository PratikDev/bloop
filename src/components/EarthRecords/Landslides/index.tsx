"use client";

import { Button } from "@/components/ui/button";
import { classLabel } from "@/lib/earth/class-grid";
import { classesRule, classState, LANDSLIDE_VOICE } from "@/lib/earth/classes";
import { cellsPerClass, slideBrailleLine, slideDescription, slideLine, slideSoundText } from "@/lib/earth/landslide";
import { slideProvenance } from "@/lib/earth/landslide-provenance";
import { formatInteger, formatUtc } from "@/lib/i18n";
import { useAppState, useT } from "../../AppState/use-app-state";
import { DataTable } from "../../EarthData/DataTable";
import { HowWeGotThis } from "../../HowWeGotThis";
import { StatusBadge } from "../../StatusBadge";
import { TranscriptLink } from "../../TranscriptLink";
import { AgeNote } from "../AgeNote";
import { ClassCanvas } from "../ClassCanvas";
import { EarthMap } from "../EarthMap";
import { BrailleLine, DescribeButton, LinerNotes, TableToggle } from "../RecordTools";
import { usePlaceNames } from "../use-place-names";
import { slideLinerNotes } from "./liner";
import { ExampleButton } from "./ExampleButton";
import { useLandslides } from "./use-landslides";

/**
 * Landslide exposure (P3): SVS 5584's LHASA classes as thresholded sound at the needle: silence for "none shown" and
 * "low" (stated), a soft rumble for moderate, stronger for high, slow pulses for very high. Modelled exposure, not
 * observed landslides. Its age is shown, with "may be out of date" past the product's freshness limit.
 */
export function Landslides() {
  const t = useT();
  const { state } = useAppState();
  const lang = state.lang;
  const s = useLandslides();
  const placeNames = usePlaceNames(s.places?.map((p) => p.at) ?? []);
  const exposedNames = usePlaceNames(s.exposed);
  const needleName = usePlaceNames([s.needle]);
  if (s.error) return <StatusBadge kind="error">{t("official.error")}</StatusBadge>;
  if (!s.grid || s.code === null) return <StatusBadge kind="loading">{t("official.loading")}</StatusBadge>;
  const { meta, codes } = s.grid;
  const place = needleName?.[0] ?? t("place.latlon", s.needle);
  const rule = classesRule(LANDSLIDE_VOICE);
  const decoded = cellsPerClass(s.grid);
  const placeLabel = (id: string, i: number) => (id === "cht" ? t("earth.slide.cht") : (placeNames?.[i] ?? id));
  return (
    <div data-provenance-group="" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]" data-testid="record-landslide_lhasa">
      <div className="space-y-3">
        <p className="text-body text-haze">{t("earth.slide.lead")}</p>
        <EarthMap testId="slide-map" label={`${t("earth.slide.alt", { date: formatUtc(meta.frame_time_utc, lang) })} ${t("earth.map.needle", { place })}`} needle={s.needle} onMove={s.setNeedle}>
          <ClassCanvas width={meta.grid.width} height={meta.grid.height} codes={codes} swatches={meta.legend_swatches_rgb} nodata={meta.grid.nodata} />
        </EarthMap>
        <p className="text-small text-haze">{t("earth.map.keys")}</p>
        <div data-provenance-group="" className="space-y-2" data-testid="slide-readout">
          <p className="text-body" data-testid="slide-line" data-class={s.code}>
            {place}: {slideLine(t, lang, meta, s.code)}
          </p>
          <p className="text-small text-moon">{t("earth.slide.label")}</p>
          <BrailleLine line={slideBrailleLine(meta, s.code)} />
          <HowWeGotThis facts={[slideProvenance(t, lang, meta, place)]} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="h-11 rounded-full px-4 text-body" onClick={() => void (s.playing ? s.stop() : s.play())} data-testid="slide-play">
            {s.playing ? t("earth.stop") : t("earth.play")}
          </Button>
          <DescribeButton describe={(tt, l, level) => slideDescription(tt, l, meta, s.code ?? 0, level, place)} />
          <LinerNotes lines={slideLinerNotes(t, meta)} />
        </div>
        <TranscriptLink record="landslide_lhasa" label={t("earth.slide.title")} />
      </div>
      <aside className="space-y-4">
        <AgeNote product={meta.product} sourceTime={meta.source_time_utc} />
        <section className="space-y-2">
          <p className="text-small text-haze">{t("earth.slide.places")}</p>
          <div className="flex flex-wrap gap-2">
            {(s.places ?? []).map((p, i) => (
              <Button key={p.id} variant="outline" className="h-11 rounded-full px-4 text-body" data-place={p.id} onClick={() => s.setNeedle(p.at)}>
                {placeLabel(p.id, i)}
              </Button>
            ))}
          </div>
          <p className="text-small text-haze">{t("earth.slide.exposedLead")}</p>
          <div className="flex flex-wrap gap-2">
            {s.exposed.map((r, i) => (
              <Button key={i} variant="outline" className="h-11 rounded-full px-4 text-body" data-exposed={i} onClick={() => s.setNeedle({ lat: r.lat, lon: r.lon })}>
                {t("earth.fire.region", { place: exposedNames?.[i] ?? t("place.latlon", r), cls: t("data.text", { text: classLabel(meta, r.topClass) ?? "" }) })}
              </Button>
            ))}
          </div>
        </section>
        <TableToggle>
          <DataTable
            testId="slide-table"
            caption={t("earth.slide.table.caption")}
            columns={[t("earth.slide.table.class"), t("earth.slide.table.sound"), t("earth.slide.table.pipeline"), t("earth.slide.table.app"), t("earth.slide.table.example")]}
            current={meta.classes.findIndex((c) => c.code === s.code)}
            currentLabel={t("earth.map.needle", { place })}
            rows={meta.classes.map((c, i) => [
              t("data.text", { text: c.label }),
              classState(rule, c.code)?.sound === "rumble" ? slideSoundText(t, c.code) : t("earth.badge.silent"),
              formatInteger(meta.cells_per_class[i] ?? 0, lang),
              formatInteger(decoded[i] ?? 0, lang),
              <ExampleButton key="x" code={c.code} label={t("data.text", { text: c.label })} onGo={s.setNeedle} grid={s.grid} from={s.needle} />,
            ])}
          />
        </TableToggle>
      </aside>
    </div>
  );
}
