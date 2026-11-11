import type { TrackMode } from "@/lib/audio/types";
import { ASK_RECORDS, type AskPage, type IntentOf } from "@/lib/ask-bloop/intents";
import { resolvePlace } from "@/lib/ask-bloop/places";
import type { SearchEntry } from "@/lib/geo/search";
import type { BoundT, Lang, MessageKey } from "@/lib/i18n";
import type { Mode } from "../AppState/reducer";
import { MODE_LABELS } from "../Commands/use-commands";
import { plain, type Answer, type AskContext } from "./context";

const PAGE_MODE: Record<AskPage, Mode> = {
  listen: "explore",
  tour: "story",
  thenNow: "thenNow",
  how: "how",
  official: "official",
  turntable: "turntable",
  team: "team",
  home: "home",
};

export const RECORD_LABEL = { ocean: "track.ocean", rain: "track.rain", both: "track.both" } as const satisfies Record<TrackMode, MessageKey>;

const entryName = (e: SearchEntry, lang: Lang) => (lang === "bn" && e.nameBn ? e.nameBn : e.name);

export async function placeOrAsk(ctx: AskContext, said: string): Promise<{ entry: SearchEntry } | { answer: Answer }> {
  const gaz = await ctx.gazetteer();
  const m = resolvePlace(said, gaz.search);
  if (m.kind === "one") return { entry: m.place };
  if (m.kind === "none") return { answer: plain((t) => t("ask.placeUnknown", { place: said })) };
  return { answer: plain((t, lang) => t("ask.placeWhich", { options: m.options.map((o) => entryName(o, lang)).join(` ${t("ask.or")} `) })) };
}

const cycle = (track: TrackMode, dir: 1 | -1): TrackMode => ASK_RECORDS[(ASK_RECORDS.indexOf(track) + dir + ASK_RECORDS.length) % ASK_RECORDS.length];

const recordAnswer = (record: TrackMode): Answer => ({ ...plain((t) => t("ask.answer.record", { record: t(RECORD_LABEL[record]) })), silent: true });

export async function runAction(ctx: AskContext, intent: IntentOf<"play" | "pause" | "stop" | "select_record" | "next_record" | "previous_record" | "go_to_place" | "set_time" | "open_page" | "set_setting">): Promise<Answer | null> {
  const { commands, state, dispatch } = ctx;
  switch (intent.name) {
    case "play":
      if (!state.soundOn) await commands.enableSound();
      else if (!state.playing) commands.togglePlaying();
      return plain((t) => t("ask.answer.play"));
    case "pause":
      if (state.playing) commands.togglePlaying();
      return plain((t) => t("ask.answer.pause"));
    case "stop":
      commands.stopAll();
      return plain((t) => t("ask.answer.stop"));
    case "select_record":
      commands.setTrack(intent.record);
      return recordAnswer(intent.record);
    case "next_record":
    case "previous_record": {
      const record = cycle(state.track, intent.name === "next_record" ? 1 : -1);
      commands.setTrack(record);
      return recordAnswer(record);
    }
    case "go_to_place": {
      const found = await placeOrAsk(ctx, intent.place);
      if ("answer" in found) return found.answer;
      const moved = plain((t, lang) => t("ask.answer.place", { place: entryName(found.entry, lang) }));
      commands.setCursor({ lat: found.entry.lat, lon: found.entry.lon }, { remember: true, lead: moved.line(ctx.t, ctx.lang) });
      return { ...moved, silent: true };
    }
    case "set_time":
      await ctx.stepFrame(intent.step === "next_frame" ? 1 : -1);
      return null;
    case "open_page":
      commands.setMode(PAGE_MODE[intent.page]);
      return plain((t) => t("ask.answer.page", { page: t(MODE_LABELS[PAGE_MODE[intent.page]]) }));
    case "set_setting":
      return setting(ctx, intent, dispatch);
  }
}

function setting(ctx: AskContext, intent: IntentOf<"set_setting">, dispatch: AskContext["dispatch"]): Answer {
  const said = (name: MessageKey, value: MessageKey) => plain((t: BoundT) => t("ask.answer.setting", { setting: t(name), value: t(value) }));
  if (intent.setting === "verbosity") {
    dispatch({ type: "setAccess", patch: { verbosity: intent.value } });
    return said("access.verbosity", `access.verbosity.${intent.value}`);
  }
  if (intent.setting === "speech_output") {
    dispatch({ type: "setAccess", patch: { speechMode: intent.value } });
    return said("access.speech", `access.speech.${intent.value}`);
  }
  ctx.setInputLang(intent.value);
  ctx.commands.setLang(intent.value);
  return said("ask.inputLanguage", `ask.inputLanguage.${intent.value}`);
}
