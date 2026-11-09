# Data integration: status

**Branch:** `feat/data-all` (from `feat/3d-scenes-1`).
**Plan:** [data-integration-plan.md](data-integration-plan.md).
**Last update:** 28 Oct 2026, end of phase 1.

- Every number below comes from the pipeline JSON or a test log; the book values are listed for comparison only.
- Screenshots and run logs are in [docs/data-all/phase1/](data-all/phase1/).

## Phase 1 at a glance

| Item | State |
|---|---|
| Core refresh (A2) | **Done.** SST frame 27 Oct 00:00 UTC, rain frame 28 Oct 08:30 UTC, 48-frame sequence. `latest_check` regenerated. A2 **PASS** against the local production build; the deployed A2 waits for the `main` merge (see [data-all-main-pr.md](data-all-main-pr.md)) |
| Daily Actions cron | **Written** (`data-daily` / `data-weekly` / `data-static` + the shared `data-run`). Each runs only from `main`; locally the same `run_all.py --cadence daily` steps pass |
| `freshness.json` + age badge | **Done.** 21 products; badges on every frame label, record sleeve, Truth section and Mapping voice; the recorded texture is wired |
| S-NPP → NOAA-20/21 | **Done for data:** FIRMS NOAA-21/NOAA-20 daily, VJ146A2 night lights. NOAA-20 NDVI found in CMR (`VJ113A1` v002, used in phase 3) |
| Truth pairs + C1 | **Done:** `truth/sst_pairs.json`, `truth/rain_pairs.json`, `truth/threeway.json`, the U key, the Truth button and the 3D-18 proof helix |
| 5176 anomaly + normal tone | **Done:** `latest/sst_anom.*`, `latest/sst_dt.*`, the `normalTone` and `clarity` voices, the Sound terrain N toggle |
| FWI archive / 5584 / 5113 in the daily job | **Done** (archive day 1 = 28 Oct) |
| Foundation UI | **Done:** place-record plugin type, GHG sleeve, sleeve back from JSON, A2 captions, Help (U + scene keys), Bangla drafts marked "needs translator review", product credits |

## Products (spotcheck: 63 passed, 0 failed)

| Product | Spotcheck | Fresh value | Book check | Source time (UTC) | Size |
|---|---|---|---|---|---|
| `latest/sst.*` (5101) + `latest_check` | PASS | Median \|frame − MUR\| **0.29 °C**, p90 0.65, bias +0.10 (60 pts, MUR 27 Oct) | 0.31 °C (falsifier > 0.1 °C off) | 2026-10-27 00:00 | 1.26 MB |
| `latest/rain.*` (4285) + `latest_check` | PASS | IMERG **Early**, agreement **100%**, median \|log10\| 0.098 (≈ **25%**), 150 rain pts | ≈27%, 100% | 2026-10-28 08:30 | 5.73 MB |
| `sequence/*` (48 frames) | PASS | 27 Oct 09:00 → 28 Oct 08:30, 30-min steps, 0% unmatched | — | 2026-10-28 08:30 | 10.0 MB |
| `truth/sst_pairs.json` | PASS (= latest_check exactly) | 60 pairs | median = panel figure | 2026-10-27 | 9 KB |
| `truth/rain_pairs.json` | PASS (= latest_check exactly) | 150 rain + 150 dry | median = panel figure | 2026-10-28 08:30 | 42 KB |
| `truth/threeway.json` (G7) | PASS | GIBS decode **100%**. Median \|GIBS − MUR\| **0.066 °C**, \|frame − MUR\| 0.279 °C, \|frame − GIBS\| 0.319 °C (55/60 points; 2 below GIBS's 0 °C bin, 3 on no-data pixels) | GIBS decodes 100% | 2026-10-27 | 16 KB |
| `latest/sst_anom.*` (5176) | PASS | Ticks **9/9** at x 127.0…896.0 (96.12 px/°C). vs CRW: sign **89.9%** (n 1,096), Spearman **0.79**, offset **−0.27 °C** (\|·\| 0.46). 2.3% of pixels saturate at ±4 °C | 91%, 0.79, −0.31; ticks 127…896, 96.1 | **2026-10-25** (the SVS 5176 frame is 2 days older than 5101; labelled) | 1.50 MB |
| `latest/sst_dt.*` (MUR dt_1km_data) | PASS (land mask = sst.bin) | 22% of ocean cells had a 1 km look; median 18 h | Field present | 2026-10-27 09:00 | 0.53 MB |
| `latest/fwi_class.*` (5315) + archive | PASS | 6 classes distinct; **93%** of coloured px decode; all Bangladesh cities "very low" | 6 classes, 93% | 2026-10-28 06:11 | 0.53 MB + 1 day |
| `latest/landslide_class.*` (5584) | PASS | **4** legend classes read from the picture; 1,806 exposed cells | "3 categories" | 2026-10-28 04:00 | 0.53 MB |
| `latest/fires.*` (5113, picture only) | PASS | `values_read: false` | — | 2026-10-28 10:29 | 0.12 MB |
| `context/firms.json` → `daily` | PASS (no S-NPP series) | Bangladesh, last 5 d: NOAA-21 **20**, NOAA-20 **10**, MODIS **1**; CHT 1 / 3 / 0; Punjab 565 / 522 / 130 | K4: "0 / 0 / 0" (see the disagreements) | 2026-10-28 14:02 (query) | +16 KB |
| `context/nightlights.json` (VJ146A2) | PASS | Dhaka 11 clear nights of 14 (6–19 Oct): 24.8–42.0 nW·cm⁻²·sr⁻¹, mostly 26.8–34.5; Chattogram 16.9–32.3; Khulna 7.1–21.2 | ≈ 25–32 (S-NPP) | 2026-10-19 (≈9-day product lag) | 4 KB |
| `meta/freshness.json` | PASS | 21 products, none stale | — | — | 13 KB |
| **Total `public/data`** | PASS (< 60 MB) | **35.6 MB** | plan estimate ≈ 40 MB | — | — |

## Voices (each checked at 3 points: shown value = JSON; rule applied)

**`normalTone`** (B3): −4…+4 °C → 123.47…493.88 Hz, exponential. The reference tone is the rule's own value at 0, i.e. B3.
| Point | Anomaly (`sst_anom.bin` = scene chip) | Pitch |
|---|---|---|
| 15 N 88 E | +0.362 °C | 262.93 Hz |
| 18 N 89.5 E | +0.134 °C | 252.74 Hz |
| 12 N 85 E | +1.044 °C | 295.91 Hz |
| 16.2 N 88 E (after walking) | +0.598 °C | 273.90 Hz |

**`clarity`** (C5): 0…48 h → echo 0.1…2.4 s, linear. "No look" = 2.4 s.
| Point | Hours | Echo |
|---|---|---|
| 18.8 S 69.1 E | 26 h | 1.346 s |
| 31.1 N 40.3 W | 8 h | 0.483 s |
| 34.6 S 18.8 E | 11 h | 0.627 s |
| Bay of Bengal points | no look | 2.4 s |

**`unison`** (C1, sameAs Ocean: 220 × 4^((T+5)/40)):
| Point | Frame | File | Beats |
|---|---|---|---|
| 19.1 N 137.2 W | 25.833 °C → 640.47 Hz | 26.348 °C → 652.01 Hz | 11.54/s |
| 14.8 S 58.3 E | 26.082 °C → 646.03 Hz | 26.137 °C → 647.26 Hz | 1.23/s |
| 45.7 S 34.5 E | 7.939 °C → 344.49 Hz | 7.709 °C → 341.75 Hz | 2.74/s |

- In the UI: U spoke "Nearest checked point, 1,930 km away … Frame 29.42 degrees, NASA file 29.38 degrees", and the Truth panel showed 1.0 beats/s and the helix.
- The 60 points are spread globally, so the nearest can be far away; the line says how far.

**`recorded`** (guardrail 16): wired from `freshness.json` (`useRecordedTexture`). Nothing is stale today, so it is silent. It plays when a live track's product passes its `limit_days`.

**Mapping panel:** all four rules are rendered from `mapping.json`, with their product badges (screenshot `mapping-panel`).

## Scene: Sound terrain (updated)

| Check | Result |
|---|---|
| 3 values = JSON | ✓ (the anomaly table above; the SST at those points, 29.593 / 29.692 / 29.737 °C = `sst.bin`) |
| FPS, production build | High **140**; Low (4-core profile) + reduced motion **144** |
| Reduced-motion run | ✓ (no fly-through; cut transitions) |
| Keyboard-only run | ✓ N → "vs normal"; W walked 15.0 → 16.2 N; Enter spoke "+0.6 degrees from normal at 16.2° N, 88.0° E"; Esc → turntable. 0 errors |
| Turntable quick check | "3D = 2D ✓" (the debug overlay) |

## Guardrails (`bun test`: 30 passed, 0 failed)

- **One scale for every comparison:**
  - water = one fixed range (A3 PASS);
  - unison = the Ocean rule itself;
  - the normal-tone range = the 5176 legend range.
- **Model badge and timbre family:** every voice on a model product has `sound.family: "model"`, and only those. No phase-1 voice is on a model product.
- **S-NPP:** no current product reads S-NPP. This is enforced in both the pipeline checks and `bun test`.
- **Credits:** every published product has a credit line.
- **No number typed next to a unit in UI strings:**
  - 15 pre-existing / non-data strings are allow-listed by key, with a reason (key step sizes, drawing scales, "1 km" as MUR's product name);
  - every new number is a `{param}` filled from JSON.

## Security

- **Client bundle:** 43 files under `.next/static` scanned. None contains any of the 8 key values or a key name.
- **`.env*`:** git-ignored.
- **Pipeline output:** all of it goes through the reference suite's `redact()`. The workflow's issue body is redacted before posting.
- **Committed files:** the book and the reference suite contain no key-like strings. The only two 32-character tokens are public HydroShare resource IDs.

## Regression

- **Passing:**
  - `bun run build` ✓, `tsc --noEmit` ✓, `bun run lint` ✓;
  - `spotcheck.py` 63 / 0;
  - 0 console errors over Explore, the Truth / Mapping / Help panels, Turntable, the records carousel, Sound terrain and the phone view.
- **Not run yet:**
  - **Lighthouse accessibility:** scheduled for the phase-2 checkpoint.
  - **Phone (390 × 844):** Explore and the Truth sheet were checked for layout and work; there is no horizontal scroll.

## Reference tests (unmodified `bloop_data_tests.py`)

| Test | Result |
|---|---|
| A2 | **PASS** (local production build): numbers and freshness OK |
| A3 | **PASS**: the water voice is continuous on one range; BD −30.6…+32.2, NW India −68.8…+25.6 cm |
| C5176 | WARN by its own thresholds (PASS needs sign ≥ 0.90 and ρ ≥ 0.80): sign 89.9%, ρ 0.79, offset −0.27 °C, ticks 9/9 (book: WARN too, "usable") |
| C5315 | PASS: 93% decode, 6 classes, BD "very low" |
| C5584 | PASS: newest file 0.42 d old |
| C5113 | WARN: tile Spearman **0.59** (17,979 hot px vs 434,209 FIRMS points); CHT 5-day 2 (book 0.60–0.62) |
| E12 | PASS: key status OK (5,000 per 10 min); CHT NOAA-21 1, Punjab NOAA-21 565 |
| K4 | "PASS" 0 / 0 / 0: **not a real zero.** The country endpoint returns HTTP 400 "Invalid API call" for every source; the test reads the error text as 0 rows |
| E5 | Not re-run: it reads the S-NPP VNP46A2. The NOAA-20 replacement (`nightlights.json`) is checked instead |

## Where fresh data disagrees with the book

1. **FIRMS:**
   - The country endpoint (`/api/country/…/BGD`) now answers **HTTP 400**, so K4's "0 / 0 / 0" is an artefact, and the book's "national Bangladesh: 0 on all three (R3)" may be the same artefact.
   - The area query inside the national outline finds 20 NOAA-21 detections in 5 days.
   - The NRT day range is now **1–5** (it was 1–10).
2. **5584** shows **4** legend classes (low → very high), not 3.
3. **5176 vs CRW:** sign 89.9% (book 91%) and offset −0.27 °C (book −0.31) on the 25 Oct frame. Same Spearman. Reported, not tuned.
4. **SST check: 0.29 °C** on the 27 Oct frame vs the book's 0.31 °C, within the claim ledger's ±0.1 °C falsifier. **The app now shows 0.29**, the JSON value, so the video should say 0.29 or "about 0.3", not 0.31 (guardrail 13: one number everywhere).
5. **Black Marble on NOAA-20:** Dhaka reaches 42.0 on 19 Oct, above the book's S-NPP range of 25–32. The other clear nights are 24.8–34.5.
6. **The SVS 5176 frame lags SVS 5101 by 2 days** (25 vs 27 Oct). Both times are shown.
7. **MUR `dt_1km_data`:** only 22% of ocean cells had a recent 1 km infrared look (cloud). The Bay of Bengal points are all "no look" today, so clarity plays the longest echo there.
