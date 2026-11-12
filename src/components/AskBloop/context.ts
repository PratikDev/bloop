// What Ask Bloop's handlers get (src/components/AskBloop): the app's own commands, state and data, so every intent
// runs what the UI or a key already runs (spec §0: no synthetic clicks, no DOM reading).
import type { ShortLine, Commands, Line } from "../Commands/use-commands";
import type { AppAction, AppState } from "../AppState/reducer";
import type { BoundT, Lang } from "@/lib/i18n";
import type { LiveFields } from "@/lib/data";
import type { Gazetteer } from "@/lib/geo/gazetteer";
import type { FreshnessFile } from "@/types/data-contract";

export interface AskContext {
  t: BoundT;
  lang: Lang;
  state: AppState;
  dispatch: (a: AppAction) => void;
  commands: Commands;
  fields: LiveFields | null;
  freshness: FreshnessFile | null;
  stepFrame: (dir: 1 | -1) => Promise<void>;
  gazetteer: () => Promise<Gazetteer>;
  /** The Ask Bloop input language (what the recogniser listens for). */
  setInputLang: (lang: Lang) => void;
}

/**
 * An answer: the line said through the speech mode (built in the speech language), its braille short form when it
 * has one, the engine's own formatted results its numbers must come from (digit provenance), and, for a value, the
 * point whose tone plays after it. `null`: the handler's own path already speaks (the frame hold announces itself).
 */
export interface Answer {
  line: Line;
  short?: ShortLine;
  sources: (lang: Lang) => string[];
  tone?: { lat: number; lon: number };
  /** The app's own path already says it (a place jump's lead, the track's status): shown in the panel, not said twice. */
  silent?: boolean;
}

/** An answer with no number in it (an action's confirmation, a clarifying question). */
export const plain = (line: Line): Answer => ({ line, sources: () => [] });
