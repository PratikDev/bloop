import { describe, expect, test } from "bun:test";
import { pickVoice, type VoiceInfo } from "./voice-pick";

const v = (lang: string, localService: boolean, name = lang): VoiceInfo & { name: string } => ({ lang, localService, name });

describe("pickVoice", () => {
  test("prefers a local (offline) voice of the right language", () => {
    const voices = [v("en-US", false, "net"), v("en-GB", true, "local"), v("bn-BD", false)];
    expect(pickVoice(voices, "en")?.name).toBe("local");
  });

  test("falls back to a network voice of the right language", () => {
    expect(pickVoice([v("bn-IN", false, "bn net"), v("en-US", true)], "bn")?.name).toBe("bn net");
  });

  test("no Bangla voice → null (never an English voice for Bangla)", () => {
    expect(pickVoice([v("en-US", true), v("hi-IN", true)], "bn")).toBeNull();
  });

  test("matches the language part only, any case or separator", () => {
    expect(pickVoice([v("BN_bd", true, "x")], "bn")?.name).toBe("x");
    expect(pickVoice([v("bengali", true)], "bn")).toBeNull();
    expect(pickVoice([], "en")).toBeNull();
  });
});
