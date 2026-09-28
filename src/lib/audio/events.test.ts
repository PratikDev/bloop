import { describe, expect, test } from "bun:test";
import { createEmitter } from "./events";
import type { AudioEvent } from "./types";

const caption: AudioEvent = { kind: "caption", key: "caption.test", params: { value: 1 } };

describe("audio event emitter", () => {
  test("delivers events to every listener until unsubscribed", () => {
    const e = createEmitter();
    const a: AudioEvent[] = [];
    const b: AudioEvent[] = [];
    const offA = e.subscribe((x) => a.push(x));
    e.subscribe((x) => b.push(x));
    e.emit(caption);
    offA();
    e.emit(caption);
    expect(a.length).toBe(1);
    expect(b.length).toBe(2);
  });

  test("a throwing listener does not stop the others", () => {
    const e = createEmitter();
    const got: AudioEvent[] = [];
    const originalError = console.error;
    console.error = () => {};
    e.subscribe(() => {
      throw new Error("boom");
    });
    e.subscribe((x) => got.push(x));
    e.emit(caption);
    console.error = originalError;
    expect(got).toEqual([caption]);
  });
});
