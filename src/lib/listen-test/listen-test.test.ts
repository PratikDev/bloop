// Mentor item 8: the listener test's answers come from the data (never typed), and the summary counts fixture files right.
import { describe, expect, test } from "bun:test";
// >>> CV
import { CV_TASK_IDS } from "./chord";
// <<< CV
import { readData } from "@/lib/i18n/data-sentences";
import type { CitiesThenNowFile, GlobalPlacesFile, SstPairsFile } from "@/types/data-contract";
import { report } from "../../../scripts/listen-test-summary";
import { exportName, resultsFile, summarise } from "./results";
import { buildTasks, referenceC, TASK_IDS, type TaskInputs } from "./tasks";

const pairs = readData<SstPairsFile>("truth/sst_pairs.json").pairs;
const places = readData<GlobalPlacesFile>("global/places.json").places;
const dhaka = readData<CitiesThenNowFile>("demo/cities_then_now.json").cities.find((c) => c.name === "Dhaka");
if (!dhaka) throw new Error("no Dhaka in the cities file");
const inputs = (rainAt: TaskInputs["rainAt"]): TaskInputs => ({ pairs, places, rainAt, heat: { place: "Dhaka", A: dhaka.heat.A, B: dhaka.heat.B } });

describe("tasks", () => {
  test("each answer follows the shipped values", () => {
    // Rain from a stand-in grid: wet only at the third place (the live grid is checked in the browser test).
    const wetAt = places[2];
    const tasks = buildTasks(inputs((lat, lon) => (lat === wetAt.lat && lon === wetAt.lon ? { mmPerHour: 4, phase: "liquid" } : { mmPerHour: 0, phase: "dry" })));
    // >>> CV: the chord tasks need the SST grid (none here); src/lib/listen-test/chord/chord-tasks.test.ts covers them.
    expect(tasks.map((t) => t.id)).toEqual(TASK_IDS.filter((id) => !(CV_TASK_IDS as readonly string[]).includes(id)));
    // <<< CV
    const byId = Object.fromEntries(tasks.map((t) => [t.id, t]));
    const ref = referenceC(pairs);
    const s = byId.ocean.sound;
    if (s.kind !== "tones") throw new Error("ocean plays two tones");
    expect(s.first).toBe(ref);
    expect(byId.ocean.correct).toBe(s.second > ref ? "warmer" : "colder");
    expect(byId.rain.correct).toBe(byId.rain.params.a === wetAt.name ? "first" : "second");
    const d = byId.unison.sound;
    if (d.kind !== "duets") throw new Error("unison plays two duets");
    const err = (x: { frameC: number; fileC: number }) => Math.abs(x.frameC - x.fileC);
    expect(byId.unison.correct).toBe(err(d.first) > err(d.second) ? "first" : "second");
    expect(byId.both.correct).toBe(pairs[0].lat === wetAt.lat && pairs[0].lon === wetAt.lon ? "yes" : "no");
    expect(byId.heat.correct).toBe(dhaka.heat.B.mean > dhaka.heat.A.mean ? "second" : "first");
  });

  test("no rain anywhere: the rain task is left out, never guessed", () => {
    const tasks = buildTasks(inputs(() => ({ mmPerHour: 0, phase: "dry" })));
    expect(tasks.map((t) => t.id)).not.toContain("rain");
  });
});

describe("results and summary", () => {
  test("the export holds no names and trims the comment", () => {
    const f = resultsFile("en", [], "  fine  ");
    expect(Object.keys(f).sort()).toEqual(["comment", "extras", "formative", "kind", "lang", "results", "testVersion", "version"]);
    expect(f.testVersion).toBe(1); // ART: no extra tasks ran (TEST_VERSION when they did)
    expect(f.comment).toBe("fine");
    expect(exportName(new Date("2026-11-07T09:05:00Z"))).toBe("listen-test-20261107-0905.json");
  });

  test("the summary script counts the fixture files", () => {
    const out = report("src/lib/listen-test/fixtures");
    expect(out).toContain("formative only");
    expect(out).toContain("Listeners (files): 3");
    expect(out).toMatch(/ocean\s+3\s+2\s+67%/u);
    expect(out).toMatch(/rain\s+2\s+1\s+50%/u);
    expect(out).toMatch(/unison\s+3\s+2\s+67%/u);
    expect(out).toMatch(/both\s+2\s+1\s+50%/u);
    expect(out).toMatch(/heat\s+2\s+2\s+100%/u);
    expect(out).toContain("skipped): notes.json");
    expect(summarise([], TASK_IDS).tasks.every((t) => t.n === 0)).toBe(true);
  });
});
