import { loadFirms } from "@/lib/data/context";
import type { DataIntent } from "@/lib/ask-bloop/data-intents";
import { classAt } from "@/lib/earth/class-grid";
import { firmsLine, fwiLine } from "@/lib/earth/fire-text";
import { dailyDays, dayCount, regionsAt, seriesOf } from "@/lib/earth/firms";
import { loadFwi, nextDay } from "@/lib/earth/fwi";
import { loadLandslide, slideLine } from "@/lib/earth/landslide";
import { cityNear, latestLine, loadNightLights } from "@/lib/earth/nightlights";
import { FLAGS } from "@/lib/flags";
import { bindT, type BoundT, type Lang } from "@/lib/i18n";
import { plain, type Answer, type AskContext } from "./context";

const fromLine = (line: (t: BoundT, lang: Lang) => string): Answer => ({ line, sources: (lang) => [line(bindT(lang), lang)] });

export async function runDataQuestion(ctx: AskContext, intent: DataIntent): Promise<Answer> {
  if (!FLAGS.dataAsk) return plain((t) => t("ask.clarify"));
  const { lat, lon } = ctx.state.cursor;
  switch (intent.name) {
    case "fire_weather_here": {
      const g = await loadFwi();
      const r = { fwiCode: classAt(g, lat, lon), forDay: nextDay(g.meta.frame_time_utc.slice(0, 10)) };
      return fromLine((t, lang) => `${fwiLine(t, lang, g.meta, r)} ${t("earth.fire.fwiLabel")}`);
    }
    case "fires_here": {
      const daily = (await loadFirms()).daily;
      if (!daily) return plain((t) => t("earth.ask.noFirms"));
      const region = regionsAt(daily, lat, lon)[0];
      if (!region) return plain((t) => t("earth.ask.noBox", { boxes: daily.regions.map((r) => t("data.text", { text: r })).join(", ") }));
      const source = daily.sources[0];
      const series = seriesOf(daily, region, source);
      const day = dailyDays(daily).at(-1) ?? "";
      const r = { region, source, day, count: series ? dayCount(series, day) : null };
      return fromLine((t, lang) => `${firmsLine(t, lang, daily, r)} ${t("earth.fire.pixelNote")}`);
    }
    case "landslide_here": {
      const g = await loadLandslide();
      const code = classAt(g, lat, lon);
      return fromLine((t, lang) => `${slideLine(t, lang, g.meta, code)} ${t("earth.slide.label")}`);
    }
    case "night_lights_here": {
      const file = await loadNightLights();
      const city = cityNear(file, lat, lon);
      if (!city) return plain((t) => t("earth.ask.noCity", { cities: Object.keys(file.cities).map((c) => t("data.text", { text: c })).join(", ") }));
      return fromLine((t, lang) => `${latestLine(t, lang, file, city)} ${t("earth.lights.label")}`);
    }
  }
}
