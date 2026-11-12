"use client";

import { FLAGS } from "@/lib/flags";
import { useStory } from "../../Story/use-story";
import { LetterCard } from "./LetterCard";
import { useListenLetter } from "./use-listen-letter";

/** The tour's quiet ending: a letter for the place the tour finished at (the last step's point). */
export function StoryLetter() {
  const story = useStory();
  const at = story.focus?.point;
  const built = useListenLetter(at);
  if (!FLAGS.artLetter || !built || !at) return null;
  return <LetterCard letter={built.letter} lon={at.lon} />;
}
