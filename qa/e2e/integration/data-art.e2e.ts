// Integration wires 4 and 5 on a build with the ART and DATA flags on: Water's journey includes the landslide-exposure
// step (its status "modelled", its classes' rumbles or stated silences), and the letter to the future works on DATA's
// records: a category record (fire weather, landslide exposure) records its class and says it is not a measurement,
// never "Measured by"; night lights record the measured radiance, or a gap. axe clean.
import { expect, test } from "@playwright/test";
import { violations } from "../../../src/a11y/brailleText";
import { chooseRecord, expectAxeClean, fresh } from "../data/lib";
import { navTo } from "../lib/app";
import { settle } from "../mentor/lib";

test("Water's journey includes the landslide exposure step, labelled modelled", async ({ page }) => {
  await fresh(page, "/listen");
  await page.getByRole("button", { name: "Water's journey" }).click();
  const j = page.getByTestId("journey");
  await expect(j.locator("ol li")).toHaveCount(6, { timeout: 30_000 });
  const slope = j.locator("ol li").filter({ hasText: "Landslide exposure on Bangladesh's hills" });
  await expect(slope).toHaveCount(1);
  await expect(slope).toContainText("modelled exposure classes (LHASA), not observed landslides");
  await expectAxeClean(page, '[data-testid="journey"]');
});

for (const r of [
  { title: "Fires and fire weather", kind: "class", must: "no value recorded" },
  { title: "Landslide exposure (LHASA, modelled)", kind: "class", must: "not observed landslides" },
] as const) {
  test(`the letter on "${r.title}": the class, not a measurement`, async ({ page }) => {
    await fresh(page, "/listen");
    await navTo(page, "Official records");
    await chooseRecord(page, r.title);
    await settle(page, 1500);
    const box = page.getByTestId("record-letter");
    await box.getByRole("button", { name: "Leave a letter from this record" }).click();
    const card = box.getByTestId("letter-card");
    await expect(card).toHaveAttribute("data-kind", r.kind);
    const text = (await card.getByTestId("letter-text").textContent()) ?? "";
    expect(text).toContain(r.must);
    expect(text).not.toContain("Measured by");
    expect(violations(text)).toEqual([]);
    await expectAxeClean(page, '[data-testid="record-letter"]');
  });
}

test("the letter on night lights: the measured radiance, or a gap (never darkness)", async ({ page }) => {
  await fresh(page, "/listen");
  await navTo(page, "Official records");
  await chooseRecord(page, "Night lights by city (Black Marble)");
  await settle(page, 1500);
  const box = page.getByTestId("record-letter");
  await box.getByRole("button", { name: "Leave a letter from this record" }).click();
  const card = box.getByTestId("letter-card");
  const kind = await card.getAttribute("data-kind");
  expect(["radiance", "gap"]).toContain(kind);
  const text = (await card.getByTestId("letter-text").textContent()) ?? "";
  if (kind === "radiance") expect(text).toMatch(/Night lights \d+\.\d nW cm/u);
  else expect(text).toContain("A gap, not darkness.");
  await expectAxeClean(page, '[data-testid="record-letter"]');
});
