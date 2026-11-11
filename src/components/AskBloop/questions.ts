import { compareShort } from "@/a11y/shortForms";
import { voiceSpec } from "@/lib/audio/mapping";
import { ruleText } from "@/lib/audio/mapping-text";
import type { TrackMode } from "@/lib/audio/types";
import type { IntentOf } from "@/lib/ask-bloop/intents";
import { compareAt, type CompareLayer } from "@/lib/compare";
import { loadGlobalLayer, type LatLon } from "@/lib/data";
import { liveRainFrame, sstGrid } from "@/lib/describe/facts";
import type { Extreme, ValueGrid } from "@/lib/describe/stats";
import { bindT, formatMonth, type BoundT, type Lang } from "@/lib/i18n";
import { ruleTextBn } from "@/lib/i18n/bn/rules";
import { provenanceLine } from "@/lib/provenance/spoken";
import { oceanText, rainText, readAt, spokenReading } from "@/lib/reading";
import { extremeNear } from "@/lib/sonar";
import { oceanTruth, rainTruth } from "@/lib/truth";
import { compareText } from "../Dock/CompareMenu/use-compare";
import { ttFor } from "../Turntable/i18n";
import { placeText } from "../Turntable/place-text";
import { placeOrAsk } from "./actions";
import { plain, type Answer, type AskContext } from "./context";

type QuestionIntent = IntentOf<"value_here" | "value_at" | "extreme_in" | "compare_dates" | "what_am_i_hearing" | "about_record" | "how_reliable">;

const loading = plain((t) => t("ask.loading"));
const recordOf = (track: TrackMode): "ocean" | "rain" => (track === "rain" ? "rain" : "ocean");

async function where(ctx: AskContext, said: string | null): Promise<{ at: LatLon; name: ((lang: Lang) => string) | null } | { answer: Answer }> {
  if (said === null) return { at: ctx.state.cursor, name: null };
  const found = await placeOrAsk(ctx, said);
  if ("answer" in found) return found;
  const e = found.entry;
  return { at: { lat: e.lat, lon: e.lon }, name: (lang) => (lang === "bn" && e.nameBn ? e.nameBn : e.name) };
}

function valueAnswer(ctx: AskContext, at: LatLon, name: ((lang: Lang) => string) | null): Answer {
  const fields = ctx.fields!;
  const reading = readAt(fields, at);
  const track = ctx.state.track;
  const said = (t: BoundT) => spokenReading(t, reading, track, at);
  return {
    line: (t, lang) => (name ? t("ask.answer.valueAt", { place: name(lang), reading: said(t) }) : said(t)),
    sources: (lang) => [said(bindT(lang))],
    tone: at,
  };
}

export async function runQuestion(ctx: AskContext, intent: QuestionIntent): Promise<Answer> {
  const { fields, state } = ctx;
  switch (intent.name) {
    case "value_here":
      return fields ? valueAnswer(ctx, state.cursor, null) : loading;
    case "value_at": {
      if (!fields) return loading;
      const w = await where(ctx, intent.place);
      return "answer" in w ? w.answer : valueAnswer(ctx, w.at, w.name);
    }
    case "extreme_in": {
      if (!fields) return loading;
      const w = await where(ctx, intent.place);
      if ("answer" in w) return w.answer;
      const record = recordOf(state.track);
      const grid: ValueGrid | null = record === "ocean" ? sstGrid(fields.sst) : fields.rain ? liveRainFrame(fields.rain).grid : null;
      const found: Extreme | null = grid ? extremeNear(grid, w.at, intent.kind) : null;
      if (!found) return plain((t) => t("ask.answer.extremeNone"));
      const value = (t: BoundT) =>
        record === "ocean" ? oceanText(t, { track: "ocean", valueC: found.value }) : rainText(t, { track: "rain", mmPerHour: found.value, phase: found.value > 0 ? "liquid" : "dry" }, true);
      const gaz = await ctx.gazetteer();
      const place = (lang: Lang) => placeText(ttFor(lang), lang, gaz.whereAmI(found), true).line;
      return {
        line: (t, lang) => t("ask.answer.extreme", { what: t(intent.kind === "highest" ? "ask.highest" : "ask.lowest"), value: value(t), place: place(lang) }),
        sources: (lang) => [value(bindT(lang)), place(lang)],
        tone: found,
      };
    }
    case "compare_dates":
      return compareDates(ctx, intent);
    case "what_am_i_hearing": {
      const voices = state.track === "both" ? (["ocean", "rain"] as const) : ([recordOf(state.track)] as const);
      const rule = (lang: Lang) => voices.map((v) => (lang === "bn" ? ruleTextBn(voiceSpec(v)) : ruleText(voiceSpec(v)))).join(" ");
      return { line: (_t, lang) => rule(lang), sources: (lang) => [rule(lang)] };
    }
    case "about_record": {
      const record = intent.record ?? state.track;
      const lines = (t: BoundT, lang: Lang) =>
        [
          record !== "rain" && fields ? provenanceLine(t, lang, ctx.freshness, "sst", fields.sst.meta) : null,
          record !== "ocean" && fields?.rain ? provenanceLine(t, lang, ctx.freshness, "rain", fields.rain.meta) : null,
        ]
          .filter((l) => l !== null)
          .join(" ");
      if (!fields) return loading;
      return { line: lines, sources: (lang) => [lines(bindT(lang), lang)] };
    }
    case "how_reliable": {
      if (!fields) return loading;
      const record = recordOf(state.track);
      const sentence = (t: BoundT): string | null => {
        if (record === "ocean") {
          const truth = oceanTruth(fields.sst.meta);
          return truth ? t("truth.ocean.sentence", truth) : null;
        }
        return fields.rain ? t("truth.rain.sentence", rainTruth(fields.rain.meta)) : null;
      };
      if (sentence(ctx.t) === null) return plain((t) => t("ask.answer.noCheck"));
      return { line: (t) => sentence(t) ?? t("ask.answer.noCheck"), sources: (lang) => [sentence(bindT(lang)) ?? ""] };
    }
  }
}

async function compareDates(ctx: AskContext, intent: IntentOf<"compare_dates">): Promise<Answer> {
  const w = await where(ctx, intent.place);
  if ("answer" in w) return w.answer;
  const name: CompareLayer = ctx.state.track === "rain" ? "rain" : "heat";
  const layer = await loadGlobalLayer(name);
  const months = layer.months;
  if (!months.includes(intent.dateA) || !months.includes(intent.dateB)) {
    const [from, to] = [months[0], months[months.length - 1]];
    return plain((t, lang) => t("ask.answer.outside", { from: formatMonth(from, lang), to: formatMonth(to, lang) }));
  }
  const result = compareAt(layer, name, w.at, intent.dateA, intent.dateB);
  const text = (t: BoundT, lang: Lang) => compareText(result, t, lang);
  return { line: text, short: (_t, lang, degree) => compareShort(lang, degree, result), sources: (lang) => [text(bindT(lang), lang)] };
}
