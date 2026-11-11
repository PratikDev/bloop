// Task "chordVariety" (2AFC): two real boxes with clearly different P10–P90 spreads (today's widest and narrowest), each
// played as its 10th, 50th and 90th percentile; the answer is the box with the wider spread. Order: boxes.json order.
import type { Task } from "../tasks";
import { boxViews, centre, type BoxView } from "./views";

const STEP_MS = 700;

const spread = (v: BoxView) => (v.stats.p90 ?? 0) - (v.stats.p10 ?? 0);
const steps = (v: BoxView) => ({ ...centre(v.box), values: [v.stats.p10 ?? 0, v.stats.p50 ?? 0, v.stats.p90 ?? 0] as [number, number, number] });

export function varietyTask(sst: Parameters<typeof boxViews>[0]): Task | null {
  const views = boxViews(sst);
  if (views.length < 2) return null;
  const wide = views.reduce((a, b) => (spread(b) > spread(a) ? b : a));
  const narrow = views.reduce((a, b) => (spread(b) < spread(a) ? b : a));
  if (spread(wide) === spread(narrow)) return null;
  const [first, second] = views.indexOf(wide) < views.indexOf(narrow) ? [wide, narrow] : [narrow, wide];
  return {
    id: "chordVariety",
    params: { a: first.box.id, b: second.box.id },
    options: ["first", "second"],
    correct: first === wide ? "first" : "second",
    sound: { kind: "views", first: steps(first), second: steps(second), stepMs: STEP_MS },
  };
}
