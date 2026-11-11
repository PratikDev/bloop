// Ask Bloop's four DATA questions (DATA): each is answered at the needle with the same words the records use, built
// from the shipped files (fire weather class, FIRMS count in the box or "no FIRMS box here", LHASA class, Black Marble at
// the nearest city or "no city near here"). Runs on a build with NEXT_PUBLIC_ASK_BLOOP=1 and NEXT_PUBLIC_DATA_ASK=1.
import { expect, test, type Page } from "@playwright/test";
import { classAt } from "../../../src/lib/earth/class-grid";
import type { FwiClassMetadata, LandslideClassMetadata } from "../../../src/types/data-contract";
import { open } from "../lib/app";
import { axeSerious } from "../lib/axe";
import { settle } from "../mentor/lib";
import { readBin, readJson } from "./lib";

const box = (page: Page) => page.getByTestId("ask-input");

async function openAsk(page: Page) {
  await open(page);
  await page.goto("/listen");
  await settle(page, 1500);
  await page.getByRole("button", { name: "Ask Bloop" }).click();
  await expect(box(page)).toBeVisible();
}

async function ask(page: Page, text: string): Promise<string> {
  const answer = page.getByTestId("ask-answer");
  const before = (await answer.innerText().catch(() => "")).trim();
  await box(page).fill(text);
  await box(page).press("Enter");
  // A new answer: not empty, not the placeholder, and not the previous answer.
  await expect
    .poll(async () => {
      const now = (await answer.innerText()).trim();
      return now !== "" && now !== "No answer yet." && now !== before;
    }, { timeout: 15_000 })
    .toBe(true);
  await page.waitForTimeout(500);
  return (await answer.innerText()).trim();
}


test("fire weather, fires, landslides and night lights here: answered from the files, in the records' words; axe clean", async ({ page }) => {
  await openAsk(page);
  const fwi = readJson<FwiClassMetadata>("latest/fwi_class.json");
  const slide = readJson<LandslideClassMetadata>("latest/landslide_class.json");
  // The needle at Dhaka (Ask Bloop's own "go to"); Dhaka's point from the night-lights file (the same cell).
  await ask(page, "go to Dhaka");
  const at = readJson<{ cities: Record<string, { lat: number; lon: number }> }>("context/nightlights.json").cities.Dhaka;
  const a1 = await ask(page, "what is the fire weather here");
  expect(a1).toContain("experimental 1-day forecast");
  {
    const code = classAt({ meta: fwi, codes: new Uint8Array(readBin("latest/fwi_class.bin")) }, at.lat, at.lon);
    expect(a1).toContain(code === 0 ? "no forecast at this point" : fwi.classes.find((c) => c.code === code)!.label);
  }
  const a2 = await ask(page, "are there fires here");
  expect(/FIRMS:|Silence: no detections in this box/u.test(a2)).toBe(true);
  expect(a2).toContain("not one fire");
  expect(a2).toContain("Bangladesh");
  const a3 = await ask(page, "landslide risk here");
  expect(a3).toContain("Modelled exposure (LHASA), not observed landslides.");
  {
    const code = classAt({ meta: slide, codes: new Uint8Array(readBin("latest/landslide_class.bin")) }, at.lat, at.lon);
    expect(a3).toContain(slide.classes.find((c) => c.code === code)!.label);
  }
  const a4 = await ask(page, "night lights here");
  expect(a4).toContain("Dhaka");
  expect(a4).toContain("not darkness");
  expect(await axeSerious(page, '[data-testid="ask-bloop"]')).toEqual([]);
});

test("asked in Bangla, the same questions are understood", async ({ page }) => {
  await openAsk(page);
  for (const q of ["এখানে আগুন-আবহাওয়া কেমন", "এখানে ভূমিধসের ঝুঁকি", "এখানে রাতের আলো"]) {
    const a = await ask(page, q);
    expect(a).not.toContain("Did you mean a place or a record");
  }
});
