// Feature inventory, checked in the running app (docs/FEATURES_WORKING.md is built from these results by
// `python -m health.features` in pipeline/). One test per feature, in Chromium and Firefox; run once as is and once with
// every WebGL canvas hidden (FEATURES_HIDE_3D=1) for the "works with the 3D hidden" column. Each check drives the control
// the way a user would (by keyboard where the feature has a key) and asserts what the user would get: a sound above the
// noise floor, a value or place in the accessible name, a pressed or selected state, a dialog. A check that throws is
// BROKEN with its error; one that returns a limit is PARTIAL. The checks live in e2e/features/ by page.
// Results: data_raw/_tmp/features/<browser>-<3d|no3d>/<feature id>.json
import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { start } from "./lib/app";
import { controlName } from "./features/common";
import { LISTEN } from "./features/listen";
import { PAGES } from "./features/pages";
import { REACH } from "./features/reach";
import { RECORDS } from "./features/records";
import { TURNTABLE } from "./features/turntable";

const HIDE_3D = process.env.FEATURES_HIDE_3D === "1";
const OUT = join(process.cwd(), "data_raw", "_tmp", "features");
const FEATURES = [...LISTEN, ...RECORDS, ...TURNTABLE, ...PAGES, ...REACH];

for (const f of FEATURES) {
  test(`feature ${f.id}`, async ({ page, browserName }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const dir = join(OUT, `${browserName}-${HIDE_3D ? "no3d" : "3d"}`);
    mkdirSync(dir, { recursive: true });
    const base = { id: f.id, group: f.group, name: f.name, where: f.where, what: f.what, keyboard: f.keyboard, has_control: Boolean(f.control), browser: browserName,
      hide3d: HIDE_3D, checked_utc: new Date().toISOString(), test: `e2e/features.e2e.ts › feature ${f.id}` };
    let status = "WORKING", evidence = "", limit: string | undefined, srName: string | null = null;
    try {
      await start(page, { hide3d: HIDE_3D });
      const o = await f.run(page);
      evidence = o.evidence; limit = o.limit;
      if (limit) status = "PARTIAL";
      if (f.control) srName = await controlName(page, f.control);
    } catch (e) {
      status = "BROKEN"; evidence = (e as Error).message.split("\n")[0].replace(/\u001b\[[0-9;]*m/gu, "").slice(0, 200);
    }
    if (errors.length && status === "WORKING") { status = "PARTIAL"; limit = `page error: ${errors[0].slice(0, 120)}`; }
    writeFileSync(join(dir, `${f.id}.json`), JSON.stringify({ ...base, status, evidence, limit, sr_name: srName, errors }, null, 1), "utf8");
    // With the 3D shown, a broken feature fails the suite. The 3D-hidden pass is a measurement for the "works with the
    // 3D hidden" column (no hide-3D mode exists yet, so the globe's features are expected to stop): recorded, not failed.
    if (!HIDE_3D) expect(status, evidence).not.toBe("BROKEN");
  });
}
