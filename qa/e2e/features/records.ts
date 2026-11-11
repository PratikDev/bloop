// Feature checks on the Official records page (official and related shelves) and the open data files.
import { expect } from "@playwright/test";
import { navTo } from "../lib/app";
import { sounds, type Feature } from "./common";

const SECTION = 'section[aria-labelledby="official-heading"]';

export const RECORDS: Feature[] = [
  { id: "official-shelf", group: "data", name: "Official records shelf (NASA Challenge resources as data)", where: "Official records · Records group", keyboard: false,
    what: "Lists every official record, each one SVS visualization read back into values",
    control: (page) => page.getByRole("group", { name: "Records" }),
    async run(page) {
      await navTo(page, "Official records");
      const records = page.getByRole("group", { name: "Records" }).getByRole("button");
      await expect(records.first()).toBeVisible({ timeout: 30_000 });     // the record list loads after the page opens
      const n = await records.count();
      if (n < 15) throw new Error(`${n} records listed`);
      return { evidence: `${n} records listed` };
    } },
  { id: "official-play", group: "data", name: "Play an official record", where: "Official records · a record · Play", keyboard: false,
    what: "Plays the record's one voice (Jukebox engine) and reads the value under the needle",
    control: (page) => page.locator(SECTION).getByRole("button", { name: "Play", exact: true }),
    async run(page) {
      await navTo(page, "Official records");
      await page.getByRole("button", { name: "Near-surface temperature (EIC, model)", exact: true }).click();
      const section = page.locator(SECTION);
      await section.getByRole("button", { name: "Play", exact: true }).click();
      const s = await sounds(page, "EIC near-surface temperature");
      const reading = await section.locator('p[aria-live="off"]').first().innerText();
      if (!/°C/u.test(reading)) throw new Error(`no temperature in "${reading}"`);
      return { evidence: `${s.evidence}; reads "${reading.slice(0, 80)}"` };
    } },
  { id: "record-provenance", group: "truth", name: "Record provenance card", where: "Official records · Where this comes from", keyboard: false,
    what: "SVS links, period, frame times, map position check, credits, licence and every check",
    control: (page) => page.getByRole("region", { name: "Where this comes from" }),
    async run(page) {
      await navTo(page, "Official records");
      const r = page.getByRole("region", { name: "Where this comes from" });
      const t = await r.innerText();
      for (const w of ["Credits", "Licence", "Checks", "SVS"]) if (!t.includes(w)) throw new Error(`no ${w}`);
      return { evidence: "credits, licence, checks and SVS links shown" };
    } },
  { id: "open-data", group: "forms", name: "Open data files", where: "/data/… (static JSON and grids)", keyboard: false,
    what: "Every record's manifest, validation and freshness as plain files",
    async run(page) {
      const urls = ["/data/meta/freshness.json", "/data/official/index.json", "/data/related/index.json", "/data/meta/health.json"];
      const codes = await Promise.all(urls.map(async (u) => (await page.request.get(u)).status()));
      const bad = urls.filter((_, i) => codes[i] !== 200);
      if (bad.length) throw new Error(`not served: ${bad.join(", ")}`);
      return { evidence: `${urls.join(", ")}: 200`, limit: "static files, no query API" };
    } },
];
