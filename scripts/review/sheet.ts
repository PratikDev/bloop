// Contact sheets: labelled screenshots composed on one page and saved as a single JPEG.
import { readFileSync } from "node:fs";
import type { Browser } from "@playwright/test";

export interface Tile {
  label: string;
  file: string;
}

/** `tileStyle` sizes every tile's image, e.g. "height:400px" (sizes side by side) or "width:540px" (a grid). */
export async function contactSheet(browser: Browser, tiles: Tile[], out: string, tileStyle: string, width = 1660): Promise<void> {
  const cells = tiles
    .map((t) => `<figure><figcaption>${t.label}</figcaption><img style="${tileStyle}" src="data:image/jpeg;base64,${readFileSync(t.file).toString("base64")}"></figure>`)
    .join("");
  const page = await browser.newPage({ viewport: { width, height: 400 } });
  await page.setContent(
    `<style>body{margin:0;padding:12px;background:#fff;font:600 15px Arial,sans-serif;display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start;width:${width - 24}px}
     figure{margin:0}figcaption{padding:2px 0 4px;color:#111}img{display:block;border:1px solid #999}</style>${cells}`,
  );
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await page.screenshot({ path: out, type: "jpeg", quality: 82, fullPage: true });
  await page.close();
}
