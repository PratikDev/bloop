import { describe, expect, test } from "bun:test";
import { createScheduleQueue, type ScheduledEvent } from "./queue";

const ev = (time: number, owner = "a"): ScheduledEvent => ({ time, owner, run: () => {} });
const times = (events: ScheduledEvent[]) => events.map((e) => e.time);

describe("schedule queue", () => {
  test("returns due events in time order, whatever order they were added in", () => {
    const q = createScheduleQueue();
    for (const t of [0.3, 0.1, 0.25, 0.05, 0.2]) q.add(ev(t));
    expect(times(q.advance(0, 1))).toEqual([0.05, 0.1, 0.2, 0.25, 0.3]);
    expect(q.size()).toBe(0);
  });

  test("returns nothing beyond the look-ahead window and keeps it for later", () => {
    const q = createScheduleQueue();
    for (const t of [1.0, 1.05, 1.1, 1.2]) q.add(ev(t));
    expect(times(q.advance(0.95, 0.1))).toEqual([1.0]); // horizon 1.05 is exclusive
    expect(q.size()).toBe(3);
    expect(times(q.advance(1.0, 0.1))).toEqual([1.05]);
    expect(times(q.advance(1.2, 0.1))).toEqual([1.1, 1.2]);
  });

  test("an event already in the past is returned on the next advance, not lost", () => {
    const q = createScheduleQueue();
    q.add(ev(0.5));
    expect(times(q.advance(2.0, 0.1))).toEqual([0.5]);
  });

  test("equal times keep insertion order", () => {
    const q = createScheduleQueue();
    q.add(ev(1, "first"));
    q.add(ev(1, "second"));
    q.add(ev(1, "third"));
    expect(q.advance(0, 2).map((e) => e.owner)).toEqual(["first", "second", "third"]);
  });

  test("clear(owner) removes only that owner's events; clear() removes all", () => {
    const q = createScheduleQueue();
    q.add(ev(0.1, "sweep"));
    q.add(ev(0.2, "ticks"));
    q.add(ev(0.3, "sweep"));
    q.clear("sweep");
    expect(q.advance(0, 1).map((e) => e.owner)).toEqual(["ticks"]);
    q.add(ev(0.4, "x"));
    q.add(ev(0.5, "y"));
    q.clear();
    expect(q.size()).toBe(0);
  });

  test("run receives the scheduled time", () => {
    const q = createScheduleQueue();
    let got = -1;
    q.add({ time: 0.42, owner: "a", run: (t) => (got = t) });
    for (const e of q.advance(0.4, 0.1)) e.run(e.time);
    expect(got).toBe(0.42);
  });
});
