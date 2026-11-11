// Accessibility core, step 6: the expedition log's wrapping (to the braille width) and its plain text.
import { describe, expect, test } from "bun:test";
import { addEntry, LOG_MAX, logSources, logText, wrapLines, type LogEntry } from "./expedition-log";

describe("expedition log", () => {
  test("lines wrap at spaces within the width; a word longer than a line is cut", () => {
    expect(wrapLines("Here, Bay of Bengal: 29.8 degrees Celsius.", 14)).toEqual(["Here, Bay of", "Bengal: 29.8", "degrees", "Celsius."]);
    for (const line of wrapLines("a".repeat(30) + " b", 14)) expect(line.length).toBeLessThanOrEqual(14);
    expect(wrapLines("a".repeat(30), 14)).toEqual(["a".repeat(14), "a".repeat(14), "aa"]);
  });

  test("the text: title, each entry with its time, then each source once; every line fits the width", () => {
    const log: LogEntry[] = [
      { at: "2026-11-08T10:00:00Z", text: "Here, Bay of Bengal: 29.8 degrees Celsius.", sources: ["MUR SST v4.1 (NASA/JPL PO.DAAC)"] },
      { at: "2026-11-08T10:01:00Z", text: "Dhaka, January 1981 against January 2026: 1.2 degrees warmer.", sources: ["NASA GISTEMP v4", "MUR SST v4.1 (NASA/JPL PO.DAAC)"] },
    ];
    const text = logText(log, 40, { title: "Bloop expedition log", empty: "Nothing yet.", sources: "Sources:" }, (iso) => iso.slice(11, 16));
    expect(text.startsWith("Bloop expedition log\n\n10:00\nHere, Bay of Bengal: 29.8 degrees\nCelsius.\n\n10:01\n")).toBe(true);
    expect(text).toContain("Sources:\n- MUR SST v4.1 (NASA/JPL PO.DAAC)\n- NASA GISTEMP v4\n");
    for (const line of text.split("\n")) expect(line.length).toBeLessThanOrEqual(40);
    expect(logSources(log)).toEqual(["MUR SST v4.1 (NASA/JPL PO.DAAC)", "NASA GISTEMP v4"]);
  });

  test("an empty log says so; the log keeps the newest LOG_MAX entries", () => {
    expect(logText([], 40, { title: "Log", empty: "Nothing yet.", sources: "Sources:" }, (s) => s)).toBe("Log\n\nNothing yet.\n");
    let log: LogEntry[] = [];
    for (let i = 0; i < LOG_MAX + 3; i++) log = addEntry(log, { at: "", text: String(i), sources: [] });
    expect(log.length).toBe(LOG_MAX);
    expect(log[0].text).toBe("3");
  });
});
