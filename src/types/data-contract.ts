// Shared TypeScript types for every file L1's pipeline produces under public/data/.
// This file is the one thing L1, L2 and L3 all agree on.
// These types mirror L1's real, published output (pipeline/ as of the L1 merge,
// commit 9ce77b7). L1 has frozen these shapes: any change to a pipeline output
// file must update this file in the same PR.
// Binary grids: little-endian, row 0 = north (90° N), column 0 = 180° W.

export * from "./contract/frames";
export * from "./contract/context";
export * from "./contract/demo";
export * from "./contract/mapping";
export * from "./contract/global";

// ---------------------------------------------------------------------------
// Every new file starts with a ProductHeader (product, title, pairing, datasets
// with agency + measurement/model badges, credit, disclosure, source_time_utc);
// meta/freshness.json lists them all with age and freshness limit. Built by
// pipeline/products/* (registry: pipeline/products/registry.py) and checked by
// pipeline/checks/*. The types live in ./contract-15/ by area:
//   common (header, freshness) · truth (sst/rain pairs, three-way) ·
//   ocean (sst_anom, sst_dt) · fire (fwi_class + archive, fires frame, FIRMS daily) ·
//   disasters (landslide_class) · energy (night lights) · mapping (sameAs rule).
// ---------------------------------------------------------------------------

export type * from "./contract-15";

// ---------------------------------------------------------------------------
// Not typed here (binary/image assets):
// latest/sst.bin, latest/rain.bin, latest/rain_phase.bin, sequence/*.u8.gz
//   -> raw grid bytes, decoded only inside lib/data.ts (formulas above).
// latest/sst.webp, latest/rain.png, sequence/*.png, truth/*.png
//   -> display-only images (L3).
// ---------------------------------------------------------------------------
