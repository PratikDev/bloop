// The Related shelf's hidden-record flag (pipeline/svs/onboard HIDDEN marks rows `hidden` in related/index.json).

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import type { OfficialIndex } from "@/types/data-contract";
import { listedRelated } from "./official";

const index: OfficialIndex = JSON.parse(readFileSync(new URL("../../../public/data/related/index.json", import.meta.url), "utf8"));
const hidden = index.records.filter((r) => r.hidden).map((r) => r.record);

describe("related records marked hidden", () => {
  test("the shipped index marks some records hidden, each with its reason", () => {
    expect(hidden.length).toBeGreaterThan(0);
    for (const r of index.records.filter((x) => x.hidden)) expect(r.hidden?.trim().length, r.record).toBeGreaterThan(0);
  });

  test("the shelf leaves them out by default and keeps every other record", () => {
    const listed = listedRelated(index, false).records.map((r) => r.record);
    for (const id of hidden) expect(listed).not.toContain(id);
    expect(listed.length).toBe(index.records.length - hidden.length);
  });

  test("the flag lists them again", () => {
    expect(listedRelated(index, true).records.length).toBe(index.records.length);
  });
});
