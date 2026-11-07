# Then vs Now: windows, statistics and how to rerun

Written for the mentor fixes (`docs/MENTOR_FIXES.md`, items 9 and 10). Every number in the app's Then vs Now parts comes from the pipeline: `pipeline/build_context.py` (context files), `pipeline/build_demo.py` and `pipeline/build_cities.py` (the demo files), and `pipeline/stats/then_vs_now_stats.py` (the statistics, item 10).

## 1. Rain products (item 9)

Checked on the official DWD/GPCC pages on 7 Nov 2026.

| Product | Version | Resolution | First | Last | Source |
|---|---|---|---|---|---|
| **GPCC Full Data Monthly (shipped)** | V2020 | 0.25°, 0.5°, 1.0°, 2.5° (we use 2.5°) | Jan 1891 | **Dec 2019** | [DWD: fulldata-monthly_v2020](https://opendata.dwd.de/climate_environment/GPCC/html/fulldata-monthly_v2020_doi_download.html), DOI 10.5676/DWD_GPCC/FD_M_V2020_250. Our file: `pipeline/inputs/context/gpcc_full_v2020_2.5.nc` (NOAA PSL copy); its time axis reads 1891-01 to 2019-12. |
| GPCC Full Data Monthly | V2022 | 0.25°, 0.5°, 1.0°, 2.5° | Jan 1891 | Dec 2020 | [DWD: fulldata-monthly_v2022](https://opendata.dwd.de/climate_environment/GPCC/html/fulldata-monthly_v2022_doi_download.html), DOI 10.5676/DWD_GPCC/FD_M_V2022_250 |
| GPCC Monitoring Product (near real time, SYNOP and CLIMAT) | V2022 | 1.0°, 2.5° | Jan 1982 | "two months prior to present" (no fixed end on the page) | [DWD: gpcc_monitoring_v2022](https://opendata.dwd.de/climate_environment/GPCC/html/gpcc_monitoring_v2022_doi_download.html), DOI 10.5676/DWD_GPCC/MP_M_V2022_250 |
| GPCC Precipitation Analysis Monthly | V2025 | 0.25°, 0.5°, 1.0°, 2.5° | Jan 1891 | "present month", latency two months | [DWD: gpcc_precipitation_analysis_monthly_v2025](https://opendata.dwd.de/climate_environment/GPCC/html/gpcc_precipitation_analysis_monthly_v2025_doi_download.html), DOI 10.5676/DWD_GPCC/MONTHLY_V2025_250. The page says it "merges the former Full Data Monthly with the Monitoring Product". |
| GPCP monthly (satellite + gauge) | V2.3 | 2.5° | Jan 1979 | Jun 2026 (our file) | `pipeline/inputs/context/gpcp_precip.mon.mean.nc`, NOAA PSL ([data.gpcp](https://psl.noaa.gov/data/gridded/data.gpcp.html)); "Interim data covers 2021/11 through latest" (file attribute). |

The NOAA PSL copy we ship has a stale `title` attribute ("GPCC Full Data Reanalysis Version 2018"), but its file name and time axis (to Dec 2019) are V2020's. V2018 ended in 2016.

**Decision.** Both rain sources now compare **1981–1990 with 2010–2019**, the last decade our shipped GPCC product covers.

- Full Data V2022 reaches only Dec 2020, so it doesn't give a 2016–2025 decade either.
- V2025 covers the recent years only by merging Full Data with the Monitoring Product. That is the stitching of two GPCC products that the rule rules out.
- So no one consistent GPCC product covers a newer decade, and moving to V2022 would gain a single year.

`build_demo.rain_windows()` reads the recent decade's end from the data: the last June–September that GPCC has for every city. It is not typed in.

GPCP's 2016–2025 decade stays in the files only as `rain.gpcp_newer`, labelled "GPCP only, newer decade; GPCC data ends in 2019". The Details sheet shows it under "Extra, not compared with GPCC", after the matched comparison.

The app says why, in the Monsoon part and in its Details sheet (EN and BN, from `rain.gpcc_end_note`): "GPCC stops at 2019 because the gauge version we use (GPCC Full Data Monthly V2020) ends in December 2019, so both rain records compare 1981–1990 with 2010–2019."

### What changed (from the pipeline output)

| City | GPCP before (1981–1990 vs 2016–2025) | GPCP now (1981–1990 vs 2010–2019) | GPCC (1981–1990 vs 2010–2019, unchanged) |
|---|---|---|---|
| Dhaka | −9% (means 15.10 → 13.71 mm/day) | −10% (15.10 → 13.61) | −12% (14.79 → 13.03) |
| Chattogram | −6% (means 19.03 → 17.96 mm/day) | −3% (19.03 → 18.37) | 0% (19.69 → 19.68) |
| Rajshahi | −8% (means 9.74 → 9.01 mm/day) | −6% (9.74 → 9.17) | −13% (9.32 → 8.10) |
| Sylhet | −9% (means 15.10 → 13.71 mm/day) | −10% (15.10 → 13.61) | −12% (14.79 → 13.03) |

Every caption still reads "no wetter in these records" (both sources ≤ 0 in every city). The monsoon voice plays GPCP's 2010–2019 years now, because `buildThenNowInput` takes `rain.gpcp.B` from the file. Describe reads the same caption (`use-then-now-player.ts` partLine), so it changed with it. The braille explorer covers Listen and Official records only, so Then vs Now has no braille line to change.
