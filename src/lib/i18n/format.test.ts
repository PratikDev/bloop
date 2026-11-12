import { expect, test } from "bun:test";
import { formatList } from "./format";

test("formatList reads two and three names as a sentence part", () => {
  expect(formatList(["Dhaka", "Chattogram"], "en")).toBe("Dhaka and Chattogram");
  expect(formatList(["Dhaka", "Chattogram", "Sylhet"], "en")).toBe("Dhaka, Chattogram, and Sylhet");
});

test("formatList in Bangla keeps every name and joins them with a Bangla conjunction", () => {
  const text = formatList(["ঢাকা", "চট্টগ্রাম"], "bn");
  expect(text).toContain("ঢাকা");
  expect(text).toContain("চট্টগ্রাম");
  expect(text).not.toContain(" and ");
});
