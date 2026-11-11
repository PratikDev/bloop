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
  setInputLang: (lang: Lang) => void;
}

export interface Answer {
  line: Line;
  short?: ShortLine;
  sources: (lang: Lang) => string[];
  tone?: { lat: number; lon: number };
  silent?: boolean;
}

export const plain = (line: Line): Answer => ({ line, sources: () => [] });
