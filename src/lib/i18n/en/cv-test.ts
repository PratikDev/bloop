// English strings for the CV/ML build's two listener-test tasks (src/lib/listen-test/chord).
import { NAMED_BOXES } from "@/lib/cv/boxes";

const box = (id: string) => NAMED_BOXES.find((b) => b.id === id)?.name ?? id;

export const cvTestEn = {
  "lt.q.chordVariety": (p: { a: string; b: string }) =>
    `You hear two views of the ocean, ${box(p.a)} and then ${box(p.b)}, each as its low, middle and high temperatures. Which view has more variety?`,
  "lt.q.chordGroups": "You hear the spread of sea temperatures in one view, played as a chord. Do you hear one group or two?",
  "lt.opt.one": "One group",
  "lt.opt.two": "Two groups",
};
