// P6: SVS 5479 was used to check ocean2_5425 (its validation.json names it), so that record credits it.
import { expect, test } from "bun:test";
import { readData } from "@/lib/i18n/data-sentences";
import type { OfficialValidationFile } from "@/types/data-contract";
import { checkedWith } from "./checked-with";

test("ocean2_5425's checks name SVS 5479's frames (and GLORYS12 among their sources)", () => {
  const items = checkedWith(readData<OfficialValidationFile>("official/ocean2_5425/validation.json"));
  const i5479 = items.find((i) => i.svs === 5479);
  expect(i5479).toBeDefined();
  expect(i5479?.checks.length).toBeGreaterThanOrEqual(3);
  expect(i5479?.sources.some((s) => /GLORYS|GLOBAL_MULTIYEAR_PHY/u.test(s))).toBe(true);
  expect(i5479?.link).toBe("https://svs.gsfc.nasa.gov/5479/");
});
