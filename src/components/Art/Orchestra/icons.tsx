import { Fire, Lightbulb, Plant, Question, Snowflake, Waves, Wind, type Icon } from "@phosphor-icons/react";
import type { EarthCategory } from "@/lib/audio/layers/types";

export const CATEGORY_ICONS: Record<EarthCategory | "unplaced", Icon> = {
  ocean: Waves,
  air: Wind,
  land: Plant,
  fire: Fire,
  ice: Snowflake,
  people: Lightbulb,
  unplaced: Question,
};
