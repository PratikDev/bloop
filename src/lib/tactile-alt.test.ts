import { describe, expect, test } from "bun:test";
import { bindT } from "@/lib/i18n";
import { sidecarText, stlHeader, STL_HEADER_BYTES, tactileAlt, type TactileAltInput } from "./tactile-alt";

const disc: TactileAltInput = {
  label: "GISTEMP v4, Dhaka\nApril-May anomaly 1981-1983",
  sizeMm: 120,
  ridgeMm: { min: 0.4, max: 4 },
  range: { min: -3, max: 3 },
  unit: "°C",
  steps: ["1981", "1982", "1983"],
  rings: [{ name: "Dhaka", values: [0.2, null, 1.4] }],
};

describe("tactile disc alt text", () => {
  test("the alt text and extended description come from the disc's own data", () => {
    const a = tactileAlt(bindT("en"), "en", disc);
    expect(a.alt).toBe("Tactile disc, 120 millimetres across: GISTEMP v4, Dhaka, April-May anomaly 1981-1983.");
    expect(a.extended).toEqual([
      "One raised ring runs once around the disc, clockwise from the top.",
      "1981 is at the top; 1983 is just before it.",
      "A ring is 0.4 millimetres high at −3 °C and 4 millimetres high at 3 °C.",
      "Raised ticks outside the rings mark every ten years. Where a step has no value, the disc stays flat. The label is embossed above the centre hole.",
      "Highest, Dhaka: 1983, 1.4 °C.",
      "Lowest, Dhaka: 1981, 0.2 °C.",
    ]);
  });

  test("two rings are named from the centre out; Bangla uses Bangla digits", () => {
    const two = { ...disc, rings: [disc.rings[0], { name: "NW India", values: [1, 2, 3] }] };
    expect(tactileAlt(bindT("en"), "en", two).extended[0]).toBe("2 raised rings run once around the disc, clockwise from the top; from the centre out: Dhaka, NW India.");
    expect(tactileAlt(bindT("bn"), "bn", disc).alt).toContain("১২০");
  });

  test("the sidecar has both parts; the STL header is 80 printable bytes and never starts with solid", () => {
    const t = bindT("en");
    const a = tactileAlt(t, "en", disc);
    expect(sidecarText(t, a).startsWith(`Alt text\n${a.alt}\n\nExtended description\n`)).toBe(true);
    const h = stlHeader("Tactile disc, 120 mm: Dhaka °C");
    expect(h.length).toBe(STL_HEADER_BYTES);
    const s = String.fromCharCode(...h);
    expect(s.startsWith("Bloop: Tactile disc")).toBe(true);
    expect(s.toLowerCase().startsWith("solid")).toBe(false);
    expect([...h].every((b) => b >= 0x20 && b <= 0x7e)).toBe(true);
  });
});
