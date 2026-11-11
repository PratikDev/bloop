// The pitch-identity test across every record and every dial stop, on the integrated build (every CV, ART and DATA
// flag on). Each record's own "Check the data voice" renders it offline with the art layer off and at Measure, Blend and
// Music (OfflineAudioContext) and measures the data voice: settled pitch within 1 cent of the rule and of the art-off
// render, onset count and tempo the same. Every Official and listed Related record (DATA's product records and the
// radar method have no dial: they play their own sounds), plus How we know's records (live SST, IMERG rain, SVS 3912,
// Then vs Now's heat, monsoon and water). A record whose rule is not a pitch or drop rule has no plan, and says so.
// Writes docs/art/pitch_identity_integrated.json (the report's table). Chromium (offline renders are deterministic).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { PROOF_RECORDS } from "../../../src/lib/art/proof/sources";
import type { OfficialIndex } from "../../../src/types/data-contract";
import { navTo, start } from "../lib/app";
import { settle } from "../mentor/lib";

const ROOT = path.join(__dirname, "..", "..", "..");
const OUT = path.join(ROOT, "docs", "art", "pitch_identity_integrated.json");
const read = (rel: string) => JSON.parse(readFileSync(path.join(ROOT, "public/data", rel), "utf8")) as OfficialIndex;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

const official = read("official/index.json").records.filter((r) => !("kind" in r && (r as { kind?: string }).kind === "method"));
const related = read("related/index.json").records.filter((r) => !r.hidden);

interface Row {
  record: string;
  where: "how" | "official" | "related";
  pass: boolean | null;
  max_cents: number | null;
  line: string;
  detail: unknown;
}

async function runCheck(page: Page, check: ReturnType<Page["getByTestId"]>, record: string, where: Row["where"]): Promise<Row> {
  await check.getByRole("button").first().click();
  const line = check.getByTestId("dial-check-line");
  await expect.poll(async () => (await check.getAttribute("data-pass")) ?? ((await line.innerText()).includes("No data voice here to check") ? "none" : null), { timeout: 150_000 }).not.toBeNull();
  const pass = await check.getAttribute("data-pass");
  const cents = await check.getAttribute("data-cents");
  const detail = await check.getAttribute("data-detail");
  return { record, where, pass: pass === null ? null : pass === "true", max_cents: cents === null ? null : Number(cents), line: await line.innerText(), detail: detail ? JSON.parse(detail) : null };
}

test.describe.configure({ mode: "serial" });

test("every record, every dial stop: the data voice is unchanged", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "offline renders are deterministic; one browser writes the table");
  test.setTimeout(90 * 60_000);
  const rows: Row[] = [];
  await start(page, { hide3d: true });

  await navTo(page, "How we know");
  await page.getByRole("button", { name: /How the check works: Data voice check/u }).click();
  for (const r of PROOF_RECORDS) {
    const check = page.locator(`[data-record="${r}"]`).getByTestId("dial-check");
    rows.push(await runCheck(page, check, r, "how"));
  }
  await page.keyboard.press("Escape");

  await navTo(page, "Official records");
  for (const [where, list] of [["official", official], ["related", related]] as const) {
    for (const r of list) {
      const name = where === "official" ? new RegExp(`^${esc(r.title)}$`, "u") : new RegExp(`^${esc(r.title)}( \\(.*\\))?$`, "u");
      await page.getByRole("button", { name }).first().click();
      await settle(page, 800);
      const check = page.getByTestId("art-dial").first().getByTestId("dial-check");
      if (!(await check.isVisible({ timeout: 30_000 }).catch(() => false))) {
        rows.push({ record: r.record, where, pass: null, max_cents: null, line: "no dial on this record", detail: null });
        continue;
      }
      await expect(check.getByRole("button").first()).toBeEnabled({ timeout: 60_000 });
      rows.push(await runCheck(page, check, r.record, where));
    }
  }

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify({ generated_by: "qa/e2e/integration/pitch-identity-all.e2e.ts", browser: browserName, rows }, null, 1)}\n`);
  const failed = rows.filter((r) => r.pass === false);
  console.log(`PITCH-IDENTITY-ALL checked ${rows.filter((r) => r.pass !== null).length}, no plan ${rows.filter((r) => r.pass === null).length}, failed ${failed.length}`);
  expect(failed.map((r) => `${r.record}: ${r.line}`)).toEqual([]);
  for (const r of rows) if (r.max_cents !== null) expect([r.record, r.max_cents <= 1]).toEqual([r.record, true]);
});
