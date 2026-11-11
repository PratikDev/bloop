// Credits follow-up to mentor item 5 ("credits must match what plays"): the list is built from the record registry
// (src/lib/credits), so this compares what each page shows with what the shipped registry gives. Every playing
// source is under "Data in this app", the testing line holds only sources no playing record uses, and the list is
// the same wherever it is shown (How we know, Official records, the Turntable, Team).
import { expect, test, type Locator, type Page } from "@playwright/test";
import { buildCredits } from "../../../src/lib/credits/build";
import { CREDIT_GROUPS } from "../../../src/lib/credits/types";
import { listedRelated } from "../../../src/lib/data/official";
import type { FreshnessFile, OfficialIndex } from "../../../src/types/data-contract";
import { openAt, sheet, shipped, shot } from "./lib";

const expected = buildCredits({
  freshness: shipped<FreshnessFile>("meta/freshness.json"),
  official: shipped<OfficialIndex>("official/index.json"),
  related: listedRelated(shipped<OfficialIndex>("related/index.json")),
});
const DATA = CREDIT_GROUPS.flatMap((g) => expected.data[g]);

interface Shown {
  data: string[];
  testing: string[];
  links: Record<string, string | null>;
  text: string;
}

/** Opens every folded group, then reads the ids, links and text the list shows. */
async function read(list: Locator): Promise<Shown> {
  await expect(list).toBeVisible();
  for (const d of await list.locator("details").all()) await d.locator("summary").click();
  return list.evaluate((el) => {
    const ids = (sel: string) => [...el.querySelectorAll(`${sel} [data-credit-id]`)].map((li) => li.getAttribute("data-credit-id") ?? "");
    const links: Record<string, string | null> = {};
    for (const li of el.querySelectorAll("[data-credit-id]")) links[li.getAttribute("data-credit-id") ?? ""] = li.querySelector("a")?.getAttribute("href") ?? null;
    return { data: ids('[data-credits="data"]'), testing: ids('[data-credits="testing"]'), links, text: el.textContent ?? "" };
  });
}

/** Where the credits are shown, each opened as a visitor would. */
export const PLACES: { name: string; url: string; open: (page: Page) => Promise<Locator> }[] = [
  {
    name: "How we know",
    url: "/how",
    open: async (page) => {
      await page.getByRole("button", { name: "Credits", exact: true }).first().click();
      return sheet(page).getByTestId("data-credits");
    },
  },
  {
    name: "Official records",
    url: "/official",
    open: async (page) => {
      await page.getByRole("button", { name: "Credits", exact: true }).click();
      return sheet(page).getByTestId("data-credits");
    },
  },
  {
    name: "Turntable",
    url: "/turntable",
    open: async (page) => {
      await page.getByRole("button", { name: "Credits", exact: true }).click();
      return page.getByRole("dialog").getByTestId("data-credits");
    },
  },
  { name: "Team", url: "/team", open: async (page) => page.locator("main").getByTestId("data-credits") },
];

test("the credits list is the registry's, the same everywhere it is shown", async ({ page }) => {
  test.setTimeout(180_000);
  const seen: Shown[] = [];
  for (const place of PLACES) {
    await openAt(page, place.url);
    const list = await place.open(page);
    if (place.name === "How we know") {
      await expect(list).toBeVisible();
      await shot(page, "stepA", "credits", sheet(page));
    }
    const shown = await read(list);
    expect([place.name, shown.data]).toEqual([place.name, DATA.map((e) => e.id)]);
    expect([place.name, shown.testing]).toEqual([place.name, expected.testing.map((e) => e.id)]);
    for (const e of [...DATA, ...expected.testing]) expect([place.name, e.id, shown.links[e.id]]).toEqual([place.name, e.id, e.link]);
    for (const e of DATA) expect([place.name, e.id, shown.text.includes(e.name), shown.text.includes(e.provider)]).toEqual([place.name, e.id, true, true]);
    expect(shown.text).toContain("Plays in:");
    seen.push(shown);
    await page.keyboard.press("Escape");
  }
  for (const s of seen.slice(1)) expect(s).toEqual(seen[0]);
});

test("the records that play on Official records are credited (NDVI, GEOS-CF, GEOS-FP, the SVS smoke forecast)", async ({ page }) => {
  await openAt(page, "/how");
  const shown = await read(await PLACES[0].open(page));
  // Each one is found in the registry by what it is, never by a typed answer.
  const ndvi = expected.data.svs.find((e) => e.records.includes("eic_5544"));
  const smoke = expected.data.svs.find((e) => e.records.includes("rel_5624"));
  for (const e of [ndvi, smoke, ...expected.data.models.filter((m) => /GEOS-(CF|FP)/u.test(m.name))]) {
    expect(e).toBeDefined();
    expect(shown.data).toContain(e?.id ?? "");
  }
  for (const id of shown.testing) expect([id, DATA.some((e) => e.id === id)]).toEqual([id, false]);
});

test("Bangla: the words around the names are Bangla, the names stay English", async ({ page }) => {
  await openAt(page, "/how");
  await page.getByRole("banner").getByRole("button", { name: "বাংলা" }).first().click();
  await page.getByRole("button", { name: "কৃতজ্ঞতা", exact: true }).first().click();
  const list = sheet(page).getByTestId("data-credits");
  await expect(list).toContainText("এই অ্যাপের ডেটা");
  await expect(list).toContainText("আমাদের পরীক্ষায় ব্যবহৃত (বাজানো যায় না)");
  await expect(list).toContainText(DATA[0].name);
  await expect(list.locator('[lang="en"]').first()).toBeVisible();
});
