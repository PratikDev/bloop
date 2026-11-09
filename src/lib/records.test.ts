import { describe, expect, test } from "bun:test";
import type { OfficialIndexRow } from "@/types/contract-15/official";
import { buildRecords, currentRecord, findByCode, neighbour } from "./records";

const row = (record: string): OfficialIndexRow => ({ record, title: record, svs_ids: [], badge: "model", period: "", manifest: "" });
const records = buildRecords({ official: [row("one"), row("two")], frames: 48 });
const code = (c: string) => {
  const found = findByCode(records, c);
  if (!found) throw new Error(`no ${c}`);
  return found;
};

describe("records", () => {
  test("A0, how it sounds, is the first record", () => {
    expect(records[0].code).toBe("A0");
    expect(records[0].action.kind).toBe("legend");
  });

  test("codes are unique", () => {
    expect(new Set(records.map((r) => r.code)).size).toBe(records.length);
  });

  test("C codes follow the official list's order", () => {
    expect(code("C1").action).toEqual({ kind: "official", record: "one" });
    expect(code("C2").action).toEqual({ kind: "official", record: "two" });
  });

  test("code lookup ignores case and spaces; unknown codes find nothing", () => {
    expect(findByCode(records, " b2 ")?.code).toBe("B2");
    expect(findByCode(records, "B9")).toBeUndefined();
  });

  test("previous and next stay inside the group", () => {
    expect(neighbour(records, code("A0"), -1)).toBeNull();
    expect(neighbour(records, code("A3"), 1)).toBeNull();
    expect(neighbour(records, code("A1"), 1)?.code).toBe("A2");
    expect(neighbour(records, code("B5"), 1)).toBeNull();
  });

  test("the current record follows the page, the track and the time-lapse", () => {
    const at = (now: Partial<Parameters<typeof currentRecord>[1]>) => currentRecord(records, { mode: "explore", track: "both", timeLapse: false, ...now })?.code;
    expect(at({})).toBe("A3");
    expect(at({ track: "rain" })).toBe("A2");
    expect(at({ timeLapse: true })).toBe("D2");
    expect(at({ mode: "story" })).toBe("D1");
    expect(at({ mode: "thenNow" })).toBe("B1");
    expect(at({ mode: "thenNow", part: "water" })).toBe("B3");
    expect(at({ mode: "official", official: "two" })).toBe("C2");
    expect(at({ mode: "official" })).toBe("C1");
    expect(at({ mode: "home" })).toBeUndefined();
  });
});
