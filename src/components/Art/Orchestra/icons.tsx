import { Fire, Lightbulb, Plant, Question, Snowflake, Waves, Wind, type Icon } from "@phosphor-icons/react";
import type { EarthCategory } from "@/lib/audio/layers/types";

/** One small icon per Earth system (with its name beside it, never alone). */
export const CATEGORY_ICONS: Record<EarthCategory | "unplaced", Icon> = {
  ocean: Waves,
  air: Wind,
  land: Plant,
  fire: Fire,
  ice: Snowflake,
  people: Lightbulb,
  unplaced: Question,
};
