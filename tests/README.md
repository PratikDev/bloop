# Test evidence

Every claim the Jukebox makes rests on one of these tests. Pass/fail rules were written **before** each test was run.
Each folder has the scripts, small outputs (CSV, JSON, PNG) and a `results.txt`. Raw data (`.nc`, `.exr`, `.HDF5`,
full CSV downloads) is not included; the scripts download it again.

| Test | Folder | Question | Date | Result |
|---|---|---|---|---|
| A Prior art | [checkA_prior_art](checkA_prior_art/) | Has anyone built frame → value → verification → sound? | not recorded | **CONTINUE**: no exact match; colour inversion itself has prior art (mcgibs, unmap) |
| B Reuse | (desk check, no scripts) | Can we reuse SVS frames? | not recorded | **PASS**: credit "NASA's Scientific Visualization Studio"; NASA Reproduction Guidelines |
| C SST fidelity | [checkC_sst](checkC_sst/) | EIC SST frame (SVS 5101) → °C vs NASA MUR SST | 2026-09-24 | **PASS**: 60 points, median error 0.85 °C, p90 1.38 °C, bias +0.56 °C, max 2.09 °C |
| D Rain qualifies | [checkD2_rain](checkD2_rain/) (`d1`) | Does IMERG (SVS 4285) have usable frames? | 2026-09-26 | **PASS**: 3600×1800 `flatalpha` frames; liquid + frozen log colorbars, 0.1–50 mm/h |
| D2 Rain fidelity | [checkD2_rain](checkD2_rain/) | EIC rain frame → mm/h vs NASA IMERG | 2026-09-26 | **PASS**: IMERG Late 00:00 UTC; rain/no-rain agreement 100%; median \|log10 error\| 0.103 (≈27%); phase agreement 100% |
| T1 Browser access | [t1_t2_t3](t1_t2_t3/) | Can a browser read SVS pixels? | 2026-09-25 | SVS **blocked (CORS)** → pipeline needed; POWER readable; GLOBE API empty |
| T2 Frame inventory | [t1_t2_t3](t1_t2_t3/) | Latest frames and colorbars per EIC product | 2026-09-25 | **PASS**: SST 1 day old, IMERG 0 days; NDVI 5544 104 days old (stale) |
| T3 Sound responsiveness | [t1_t2_t3](t1_t2_t3/) | Is value → sound instant? | 2026-09-25 | **PASS** |
| P1 NASA POWER | [p1_power](p1_power/) | Daily data for Dhaka? | 2026-09-25 | Data **PASS**; speed **FAIL** (172 s for 1981–2026) |
| P1b POWER cross-check | [p1b_crosscheck](p1b_crosscheck/) | Does POWER agree with independent records? | 2026-09-26 | **POWER FAILED** (rain ×2.16 vs GPCP ×0.91; temp −0.89 °C vs GISTEMP +1.37 °C) |
| P2 FIRMS | [p2_firms](p2_firms/) | Fire counts accessible? | 2026-09-25 | **PASS**: CHT MODIS 2003 = 4,954 → 2023 = 4,033; Punjab MODIS 11,879 → 9,850 |
| P3 GRACE | [p3_grace](p3_grace/) | Water storage accessible + known-answer check | 2026-09-25 | **PASS**: NW India −3.25 cm/yr (documented depletion ✔); Bangladesh −0.35 cm/yr |
| P4 NDVI | [p4_ndvi](p4_ndvi/) | Vegetation series accessible? | 2026-09-25 | **PASS**: Sundarbans 0.550 → 0.566; Madhupur 0.482 → 0.530; Dhaka 0.274 → 0.260 |
| P5 GLOBE | [p5_globe](p5_globe/) | Citizen ground observations in Bangladesh? | 2026-09-26 | **PASS (via CSV)**: API empty; 831 observations, all satellite-matched, 139 locations |
| SST colorbar fix | [sst_colorbar_fix](sst_colorbar_fix/) | Is the published SST range right for the current colorbar? | 2026-09-27 | Calibrated to **−4..34 °C** (median error 0.28 °C vs 0.67 °C for the legend's −5..35) |
| Latest-frame checks | [sst_colorbar_fix](sst_colorbar_fix/) (`verify_latest.json`) | Do the published frames still match the source data? | 2026-09-27 | **PASS**: SST median 0.32 °C; rain agreement 100%, median \|log10\| 0.108 |

Source: Team Build Plan, Section 4 (`docs/TEAM_BUILD_PLAN.md`). Dates are the dates of the saved outputs; A and B were desk research with no saved output.
