// How we got this for the fires and fire-weather record (P2): the forecast class, the FIRMS counts, the picture.
import { formatDay, formatUtc, type BoundT, type Lang } from "@/lib/i18n";
import type { Provenance } from "@/lib/provenance/types";
import type { FireData } from "./fire-data";
import type { FireReading } from "./fire-text";
import { DATA_SCRIPTS, headerProvenance } from "./provenance";

export function fireProvenance(t: BoundT, lang: Lang, data: FireData, r: FireReading, place: string): Provenance[] {
  const series = data.daily.series[`${r.region}|${r.source}`];
  return [
    headerProvenance({
      t,
      lang,
      header: data.fwi.meta,
      subject: t("earth.fire.subject.fwi"),
      window: t("hwgt.window.frame", { time: formatUtc(data.fwi.meta.frame_time_utc, lang) }),
      cell: t("earth.fire.cell"),
      place,
      method: t("earth.fire.method.fwi"),
      uncertainty: t("data.text", { text: data.fwi.meta.disclosure }),
      n: null,
      scripts: DATA_SCRIPTS.fwi,
      liveCheck: "live_fwi_class",
    }),
    headerProvenance({
      t,
      lang,
      header: data.daily,
      subject: t("earth.fire.subject.firms"),
      window: series?.days.length ? t("hwgt.window.two", { a: formatDay(series.days[0], lang), b: formatDay(series.days[series.days.length - 1], lang) }) : null,
      cell: t("earth.fire.boxCell", { box: t("data.text", { text: r.region }) }),
      place: null,
      method: t("earth.fire.method.firms"),
      uncertainty: `${t("earth.fire.pixelNote")} ${t("data.text", { text: data.daily.disclosure })}`,
      n: series?.days.length ?? null,
      scripts: DATA_SCRIPTS.firms,
    }),
    headerProvenance({
      t,
      lang,
      header: data.fires,
      subject: t("earth.fire.subject.picture"),
      window: data.fires.frame_time_utc ? t("hwgt.window.frame", { time: formatUtc(data.fires.frame_time_utc, lang) }) : null,
      cell: null,
      place: null,
      method: t("earth.fire.method.picture"),
      uncertainty: t("data.text", { text: data.fires.disclosure }),
      n: null,
      scripts: DATA_SCRIPTS.fires,
      liveCheck: "live_fires_frame",
    }),
  ];
}
