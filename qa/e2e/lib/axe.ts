// axe-core in the page (devDependency, MPL-2.0): the serious and critical violations under `include` (default: the
// whole page). A chosen ChoiceGroup option is ink on a pill drawn as its own layer, which axe can't see, so it is left
// out here; braille.e2e.ts measures those separately.
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const AXE = readFileSync(join(process.cwd(), "node_modules", "axe-core", "axe.min.js"), "utf8");
const CHOSEN_PILL = '[data-slot="toggle-group-item"][aria-pressed="true"]';
// Place names drawn on the globe ([data-globe-labels], aria-hidden; "Where am I?" says the same) are text in a picture,
// which WCAG 1.4.3 exempts from contrast: they fade with the globe's curvature and sit on the WebGL Earth, which axe
// can't see. Only color-contrast is waived there; every other rule still runs on them.
const PICTURE_TEXT = "[data-globe-labels]";

export interface AxeFinding {
  id: string;
  impact: string;
  targets: string[];
}

export async function axeSerious(page: Page, include?: string): Promise<AxeFinding[]> {
  if (!(await page.evaluate(() => "axe" in window))) await page.addScriptTag({ content: AXE });
  return page.evaluate(
    async ({ include, exclude, picture }) => {
      type Result = { violations: { id: string; impact: string | null; nodes: { target: string[] }[] }[] };
      const axe = (window as unknown as { axe: { run: (c: object, o: object) => Promise<Result> } }).axe;
      const context = include ? { include: [[include]], exclude: [[exclude]] } : { exclude: [[exclude]] };
      const r = await axe.run(context, { resultTypes: ["violations"] });
      const inPicture = (target: string[]) => target.length === 1 && Boolean(document.querySelector(target[0])?.closest(picture));
      return r.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => ({ id: v.id, impact: v.impact ?? "", nodes: v.id === "color-contrast" ? v.nodes.filter((n) => !inPicture(n.target)) : v.nodes }))
        .filter((v) => v.nodes.length)
        .map((v) => ({ id: v.id, impact: v.impact, targets: v.nodes.map((n) => n.target.join(" ")) }));
    },
    { include, exclude: CHOSEN_PILL, picture: PICTURE_TEXT },
  );
}
