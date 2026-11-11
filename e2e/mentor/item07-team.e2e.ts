// Mentor item 7: "Add a Team/About section with team member name, specific role and the challenge name." The page
// renders content/team.json in English and Bangla, never shows "TODO", has one h1 and proper headings, is reached from
// the header and the footer, and works by keyboard.
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { parseTeam, shownTeam } from "../../src/lib/team";
import { axeSerious } from "../lib/axe";
import { openAt, shot } from "./lib";

const team = shownTeam(parseTeam(JSON.parse(readFileSync("content/team.json", "utf8"))));
const main = "main";

test("renders the JSON: team, members, challenge, event, credits; no TODO", async ({ page }) => {
  await openAt(page, "/team");
  const m = page.locator(main);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(team.teamName ?? "Team and about");
  for (const member of team.members) {
    await expect(m).toContainText(member.name);
    if (member.role) await expect(m).toContainText(member.role);
  }
  if (team.challenge) await expect(m).toContainText(team.challenge);
  if (team.localEvent) await expect(m).toContainText(`Local event: ${team.localEvent}`);
  await expect(m.getByTestId("data-credits")).toBeVisible();
  await expect(m).not.toContainText("TODO");
  await shot(page, "item07", "team");
});

test("one h1, headings in order, keyboard reaches every link", async ({ page }) => {
  await openAt(page, "/team");
  const levels = await page.locator(`${main} :is(h1,h2,h3,h4)`).evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
  expect(levels.filter((l) => l === 1)).toHaveLength(1);
  for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
  // Links in a folded group (the SVS list) are reached once it is opened; the visible ones by Tab alone.
  const visible = page.locator(`${main} a[href]:visible`);
  const links = await visible.evaluateAll((as) => new Set(as.map((a) => a.getAttribute("href"))).size);
  const reached = new Set<string>();
  await page.locator(main).getByRole("heading", { level: 1 }).focus();
  for (let i = 0; i < links * 2 + 40 && reached.size < links; i++) {
    await page.keyboard.press("Tab");
    const href = await page.evaluate(() => (document.activeElement?.closest("main") ? document.activeElement.getAttribute("href") : null));
    if (href) reached.add(href);
  }
  expect(reached.size).toBe(links);
  await page.locator(`${main} summary`).first().focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(`${main} details`).first()).toHaveAttribute("open", "");
  expect(await axeSerious(page, main)).toEqual([]);
});

test("reached from the header and the footers", async ({ page }) => {
  await openAt(page, "/listen");
  await page.getByRole("banner").getByRole("link", { name: /Team$/u }).first().click();
  await expect(page).toHaveURL(/\/team$/u);
  await openAt(page, "/");
  await page.locator("main footer").getByRole("link", { name: "Team and about" }).click();
  await expect(page).toHaveURL(/\/team$/u);
  await openAt(page, "/how");
  await page.getByRole("link", { name: "Team and about" }).click();
  await expect(page).toHaveURL(/\/team$/u);
});

test("Bangla: the page's words are Bangla, the names stay as written", async ({ page }) => {
  await openAt(page, "/team");
  await page.getByRole("banner").getByRole("button", { name: "বাংলা" }).first().click();
  await expect(page.locator(main)).toContainText("দলের সদস্য");
  await expect(page.locator(main)).toContainText("নাসার ডেটা দিয়ে তৈরি");
  for (const member of team.members) await expect(page.locator(main)).toContainText(member.name);
  await expect(page.locator(main)).not.toContainText("TODO");
  await shot(page, "item07", "team-bn");
});
