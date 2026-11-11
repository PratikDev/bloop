# Then vs Now: windows, statistics and how to rerun

Every number in the app's Then vs Now parts comes from the pipeline: `pipeline/build_context.py` (context files), `pipeline/build_demo.py` and `pipeline/build_cities.py` (the demo files), and `pipeline/stats/then_vs_now_stats.py` (the statistics, item 10).

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

## 2. Uncertainty and significance (item 10)

### Method

- **Input.** Only values the app already ships. Heat and rain use the yearly values in `demo/cities_then_now.json`, the same ones each part plays: heat is the April–May mean anomaly, rain the June–September mean daily rate. Rain totals (June–September and annual, mm) are built from the monthly files `context/gpcp_bd.json` and `gpcc_bd.json`, counting a year only when every month is present. Water uses `context/grace.json` (Bangladesh box) and its new `uncertainty_1sigma_cm`, the product's own 1-sigma averaged over the box by `build_context.py`.
- **Decade vs decade.** The difference of means is recent minus baseline. For rain the app shows the % change (recent mean / baseline mean − 1). The 95% interval is a bootstrap percentile interval: years are resampled with replacement within each window, 10,000 draws, fixed seed. We run two tests, both two-sided: Welch's t-test (`scipy.stats.ttest_ind`, `equal_var=False`) and Mann–Whitney U (`scipy.stats.mannwhitneyu`).
- **Rain.** We test the June–September mean rate (shown in the app), June–September totals and annual totals. The app shows the June–September mean rate.
- **Full-record trends.** Heat uses the yearly April–May series, all years with both months. Water uses the monthly GRACE series minus each calendar month's mean, so the seasonal cycle doesn't count as trend. The 11-month gap between missions stays a gap: slopes use real time differences.
  - Test: Mann–Kendall with the Hamed & Rao (1998) correction. We detrend with Sen's slope and rank the residuals. Every lag whose rank autocorrelation is outside ±1.96/√n inflates Var(S) by the factor n/n*. A factor of 1 means no correction was needed, and the tables say which test was used.
  - Slope: Sen's slope, with the Gilbert (1987) rank-based 95% CI built from the same corrected variance.
- **Wording rule.** The app calls a change clear only if Welch's p < 0.05, Mann–Whitney's p < 0.05 and the 95% CI excludes 0. Otherwise it says "No clear change in these records" ("No wetter in these records" for rain) and still shows the range.
  - The one-line result is "A clear change: larger than year-to-year variation." or "Not a clear change: year-to-year variation is larger."
  - `src/lib/then-now-stats.ts` builds the wording from the `clear` flags in `stats.json`, so it follows the file automatically.
  - Water's claim ("the water underground is falling") is a trend, so the Water part shows the trend's result. The window comparison (4 yearly means against 4) is in Details.
- **Where it shows.** The line under each part's headline (EN, BN), the Details sheet's "Uncertainty and significance" rows, the caption bar when a part starts, Describe (said after the part's caption), and a short form for the live region and so a braille display (e.g. "Rain -10% CI -19.5 to 1.1 not clear", Western digits, ≤ 40 cells in English).

### How to rerun

```
cd pipeline
python build_context.py      # only if an input file changed (adds GRACE's 1-sigma)
python build_demo.py && python build_cities.py
python -m stats.then_vs_now_stats     # writes public/data/thenvsnow/stats.json and the tables below
python -m unittest stats.tests.test_methods tests.test_build_demo
```

`run_all.py` runs the stats step after `build_cities.py`.

### Every number

<!-- stats:begin -->
Generated 2026-11-08T00:19:32Z by `pipeline/stats/then_vs_now_stats.py` (10000 bootstrap draws, seed 20261102). Means are in the record's unit: °C anomaly (heat), mm/day (rain, as the app shows), mm (totals), cm (water).

### Decade vs decade, what the app shows

| City | Record | Windows | n | Means | Change | 95% CI | Welch p | Mann–Whitney p | Result |
|---|---|---|---|---|---|---|---|---|---|
| Dhaka | Heat, April–May (GISTEMP) | 1981–1990 vs 2016–2025 | 10 / 10 | -0.140 → 1.228 | +1.37 °C | +0.88 to +1.86 | < 0.001 | < 0.001 | clear |
| Dhaka | Rain, June–Sept mean rate (GPCP) | 1981–1990 vs 2010–2019 | 10 / 10 | 15.104 → 13.612 | −9.9% | −19.5% to +1.1% | 0.101 | 0.104 | not clear |
| Dhaka | Rain, June–Sept mean rate (GPCC) | 1981–1990 vs 2010–2019 | 10 / 10 | 14.795 → 13.030 | −11.9% | −22.8% to +0.4% | 0.082 | 0.064 | not clear |
| Chattogram | Heat, April–May (GISTEMP) | 1981–1990 vs 2016–2025 | 10 / 10 | -0.140 → 1.228 | +1.37 °C | +0.88 to +1.86 | < 0.001 | < 0.001 | clear |
| Chattogram | Rain, June–Sept mean rate (GPCP) | 1981–1990 vs 2010–2019 | 10 / 10 | 19.034 → 18.374 | −3.5% | −14.0% to +9.4% | 0.594 | 0.521 | not clear |
| Chattogram | Rain, June–Sept mean rate (GPCC) | 1981–1990 vs 2010–2019 | 10 / 10 | 19.686 → 19.676 | −0.1% | −11.9% to +14.1% | 0.994 | 0.850 | not clear |
| Rajshahi | Heat, April–May (GISTEMP) | 1981–1990 vs 2016–2025 | 10 / 10 | -0.416 → 0.529 | +0.95 °C | +0.30 to +1.61 | 0.017 | 0.009 | clear |
| Rajshahi | Rain, June–Sept mean rate (GPCP) | 1981–1990 vs 2010–2019 | 10 / 10 | 9.742 → 9.168 | −5.9% | −17.4% to +7.8% | 0.399 | 0.427 | not clear |
| Rajshahi | Rain, June–Sept mean rate (GPCC) | 1981–1990 vs 2010–2019 | 10 / 10 | 9.319 → 8.104 | −13.0% | −25.9% to +1.7% | 0.107 | 0.212 | not clear |
| Sylhet | Heat, April–May (GISTEMP) | 1981–1990 vs 2016–2025 | 10 / 10 | -0.211 → 0.992 | +1.20 °C | +0.73 to +1.70 | < 0.001 | 0.001 | clear |
| Sylhet | Rain, June–Sept mean rate (GPCP) | 1981–1990 vs 2010–2019 | 10 / 10 | 15.104 → 13.612 | −9.9% | −19.5% to +1.1% | 0.101 | 0.104 | not clear |
| Sylhet | Rain, June–Sept mean rate (GPCC) | 1981–1990 vs 2010–2019 | 10 / 10 | 14.795 → 13.030 | −11.9% | −22.8% to +0.4% | 0.082 | 0.064 | not clear |
| Bangladesh box | Water, yearly means (GRACE) | 2003–2006 vs 2021–2024 | 4 / 4 | 0.870 → -5.816 | −6.69 cm | −11.27 to −2.29 | 0.046 | 0.114 | not clear |

### Rain: also checked (not shown as the headline)

| City | Record | Windows | n | Means | Change | 95% CI | Welch p | Mann–Whitney p | Result |
|---|---|---|---|---|---|---|---|---|---|
| Dhaka | June–Sept totals (GPCP) | 1981–1990 vs 2010–2019 | 10 / 10 | 1844.705 → 1661.051 | −10.0% | −19.6% to +1.0% | 0.099 | 0.104 | not clear |
| Dhaka | Annual totals (GPCP) | 1981–1990 vs 2010–2019 | 10 / 10 | 2817.308 → 2520.381 | −10.5% | −19.6% to +0.3% | 0.082 | 0.031 | not clear |
| Dhaka | June–Sept totals (GPCC) | 1981–1990 vs 2010–2019 | 10 / 10 | 1807.094 → 1589.995 | −12.0% | −22.9% to +0.3% | 0.081 | 0.064 | not clear |
| Dhaka | Annual totals (GPCC) | 1981–1990 vs 2010–2019 | 10 / 10 | 2766.599 → 2432.930 | −12.1% | −22.0% to −0.2% | 0.069 | 0.038 | not clear |
| Dhaka | GPCP only, newer decade (extra) | 1981–1990 vs 2016–2025 | 10 / 10 | 15.104 → 13.705 | −9.3% | −18.0% to +1.1% | 0.106 | 0.076 | not clear |
| Chattogram | June–Sept totals (GPCP) | 1981–1990 vs 2010–2019 | 10 / 10 | 2325.700 → 2244.789 | −3.5% | −14.1% to +9.5% | 0.595 | 0.571 | not clear |
| Chattogram | Annual totals (GPCP) | 1981–1990 vs 2010–2019 | 10 / 10 | 3083.667 → 2975.600 | −3.5% | −11.8% to +5.8% | 0.474 | 0.521 | not clear |
| Chattogram | June–Sept totals (GPCC) | 1981–1990 vs 2010–2019 | 10 / 10 | 2405.833 → 2404.375 | −0.1% | −12.0% to +14.1% | 0.993 | 0.910 | not clear |
| Chattogram | Annual totals (GPCC) | 1981–1990 vs 2010–2019 | 10 / 10 | 3160.305 → 3154.976 | −0.2% | −9.6% to +10.2% | 0.975 | 0.970 | not clear |
| Chattogram | GPCP only, newer decade (extra) | 1981–1990 vs 2016–2025 | 10 / 10 | 19.034 → 17.962 | −5.6% | −15.2% to +5.0% | 0.328 | 0.473 | not clear |
| Rajshahi | June–Sept totals (GPCP) | 1981–1990 vs 2010–2019 | 10 / 10 | 1190.036 → 1120.231 | −5.9% | −17.4% to +7.8% | 0.400 | 0.427 | not clear |
| Rajshahi | Annual totals (GPCP) | 1981–1990 vs 2010–2019 | 10 / 10 | 1680.635 → 1570.342 | −6.6% | −15.4% to +4.7% | 0.252 | 0.241 | not clear |
| Rajshahi | June–Sept totals (GPCC) | 1981–1990 vs 2010–2019 | 10 / 10 | 1138.342 → 990.773 | −13.0% | −25.8% to +1.8% | 0.109 | 0.212 | not clear |
| Rajshahi | Annual totals (GPCC) | 1981–1990 vs 2010–2019 | 10 / 10 | 1611.702 → 1377.081 | −14.6% | −24.9% to −2.1% | 0.038 | 0.038 | clear |
| Rajshahi | GPCP only, newer decade (extra) | 1981–1990 vs 2016–2025 | 10 / 10 | 9.742 → 9.006 | −7.5% | −18.8% to +5.0% | 0.268 | 0.385 | not clear |
| Sylhet | June–Sept totals (GPCP) | 1981–1990 vs 2010–2019 | 10 / 10 | 1844.705 → 1661.051 | −10.0% | −19.6% to +1.0% | 0.099 | 0.104 | not clear |
| Sylhet | Annual totals (GPCP) | 1981–1990 vs 2010–2019 | 10 / 10 | 2817.308 → 2520.381 | −10.5% | −19.6% to +0.3% | 0.082 | 0.031 | not clear |
| Sylhet | June–Sept totals (GPCC) | 1981–1990 vs 2010–2019 | 10 / 10 | 1807.094 → 1589.995 | −12.0% | −22.9% to +0.3% | 0.081 | 0.064 | not clear |
| Sylhet | Annual totals (GPCC) | 1981–1990 vs 2010–2019 | 10 / 10 | 2766.599 → 2432.930 | −12.1% | −22.0% to −0.2% | 0.069 | 0.038 | not clear |
| Sylhet | GPCP only, newer decade (extra) | 1981–1990 vs 2016–2025 | 10 / 10 | 15.104 → 13.705 | −9.3% | −18.0% to +1.1% | 0.106 | 0.076 | not clear |

### Full-record trends

| Series | Years | n | Test used | Lag-1 autocorrelation | Variance factor n/n* | Sen's slope | 95% CI | p | Result |
|---|---|---|---|---|---|---|---|---|---|
| Dhaka heat, April–May (yearly) | 1951–2026 | 76 | Mann-Kendall, Hamed-Rao modified | 0.19 | 1.39 | +0.145 °C per decade | +0.067 to +0.236 | < 0.001 | clear |
| Chattogram heat, April–May (yearly) | 1951–2026 | 76 | Mann-Kendall, Hamed-Rao modified | 0.19 | 1.39 | +0.145 °C per decade | +0.067 to +0.236 | < 0.001 | clear |
| Rajshahi heat, April–May (yearly) | 1951–2026 | 76 | Mann-Kendall | -0.00 | 1.00 | +0.050 °C per decade | −0.015 to +0.130 | 0.120 | not clear |
| Sylhet heat, April–May (yearly) | 1951–2026 | 76 | Mann-Kendall, Hamed-Rao modified | 0.23 | 1.34 | +0.123 °C per decade | +0.037 to +0.212 | 0.006 | clear |
| Water, Bangladesh box (monthly, seasonal cycle removed) | 2002–2026 | 257 | Mann-Kendall, Hamed-Rao modified | 0.61 | 5.72 | −0.323 cm per year | −0.508 to −0.139 | 0.001 | clear |
| Water, NW_India box (monthly, seasonal cycle removed) | 2002–2026 | 257 | Mann-Kendall, Hamed-Rao modified | 0.83 | 6.26 | −3.213 cm per year | −3.536 to −2.864 | < 0.001 | clear |

### GRACE's own measurement uncertainty

| Box | 1-sigma, median over months | min | max |
|---|---|---|---|
| Bangladesh | 4.52 cm | 3.34 cm | 21.23 cm |
| NW_India | 2.36 cm | 1.89 cm | 15.00 cm |

File note: "1-sigma uncertainty: not for each 0.5 degree grid cell, but for each 3-degree mascon estimate". We average it over the box like the values; that treats the mascons' errors as fully correlated, so it is an upper bound on the box mean's error.
<!-- stats:end -->
