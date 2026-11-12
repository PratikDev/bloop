import { afterEach, describe, expect, test } from "bun:test";
import { connectionAllowsPrefetch } from "./prefetch";

const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
const withConnection = (connection: object | undefined) =>
  Object.defineProperty(globalThis, "navigator", { value: connection === undefined ? {} : { connection }, configurable: true });

afterEach(() => {
  if (original) Object.defineProperty(globalThis, "navigator", original);
});

describe("connectionAllowsPrefetch", () => {
  test("on without the Network Information API (Firefox, Safari)", () => {
    withConnection(undefined);
    expect(connectionAllowsPrefetch()).toBe(true);
  });

  test("on for 4G without Data Saver", () => {
    withConnection({ effectiveType: "4g", saveData: false });
    expect(connectionAllowsPrefetch()).toBe(true);
  });

  test("off with Data Saver", () => {
    withConnection({ effectiveType: "4g", saveData: true });
    expect(connectionAllowsPrefetch()).toBe(false);
  });

  test.each(["slow-2g", "2g", "3g"])("off on %s", (effectiveType) => {
    withConnection({ effectiveType, saveData: false });
    expect(connectionAllowsPrefetch()).toBe(false);
  });
});
