// Raw-pixel vs Bloop: the numbers on screen are the stored measurement, the label says the naive
// version isn't how Bloop works, both play from their own buttons, and the naive render never plays anywhere else.
// Build with NEXT_PUBLIC_ART_RAW_PIXEL=1.
import { expect, test } from "@playwright/test";
import { formatSignificant } from "../../../src/lib/i18n";
import { AUDIBLE, heard, navTo, start } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { shipped } from "../mentor/lib";

type M = { flatness: number; entropy: number; roughness: number };
const file = shipped<{ naive: M; bloop: M }>("art/raw_pixel.json");
const s = (v: number) => formatSignificant(v, "en", 3);

test("the card shows the stored numbers and plays both versions on request only", async ({ page }) => {
  await start(page, { hide3d: true });
  await navTo(page, "How we know");
  const card = page.getByTestId("raw-pixel");
  await expect(card).toContainText("Naive version shown for comparison; it is not how Bloop works.");
  await expect(card.getByTestId("raw-numbers")).toHaveText(
    `Naive: flatness ${s(file.naive.flatness)}, roughness ${s(file.naive.roughness)}, entropy ${s(file.naive.entropy)}. Bloop: flatness ${s(file.bloop.flatness)}, roughness ${s(file.bloop.roughness)}, entropy ${s(file.bloop.entropy)}.`,
  );
  await expect(card).toHaveAttribute("data-naive-plays", "0");
  await card.getByRole("button", { name: "Hear the naive version" }).click();
  await expect(card).toHaveAttribute("data-naive-plays", "1");
  expect(await heard(page, 5000)).toBeGreaterThan(AUDIBLE);
  await card.getByRole("button", { name: "Hear Bloop" }).click();
  await expect(card).toHaveAttribute("data-bloop-plays", "1");
  await expect(card).toHaveAttribute("data-naive-plays", "1");
  expect(await axeSerious(page, '[data-testid="raw-pixel"]')).toEqual([]);
});

test("normal modes never show or play the naive version", async ({ page }) => {
  await start(page, { hide3d: true });
  for (const name of ["Listen", "Official records", "Then vs Now"] as const) {
    await navTo(page, name);
    await expect(page.getByTestId("raw-pixel")).toHaveCount(0);
  }
});
