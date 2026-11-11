# Bangla drafts for review: the `fixes` branch

New or changed Bangla strings from the audit fixes. All are drafts for a translator to check. Terms follow `docs/i18n/GLOSSARY.md`; কমলা, নীল and উষ্ণ / শীতল are as the stripe legend already uses them. Names and dataset titles (NASA GISTEMP) stay in English. `{name}` is a value the app fills in.

## Item 3: Then vs Now in plain words

| Key | English | Bangla draft | Was |
|---|---|---|---|
| `thenNow.heat.warmer` | {place} in April–May: {change} °C warmer in {now} than in {then} | {place}, এপ্রিল–মে: {then} সালের চেয়ে {now} সালে {change} °সে বেশি উষ্ণ | the data caption "…: +1.37 °C (NASA GISTEMP, 1981–1990 vs 2016–2025, 10 years each)." |
| `thenNow.heat.cooler` | {place} in April–May: {change} °C cooler in {now} than in {then} | {place}, এপ্রিল–মে: {then} সালের চেয়ে {now} সালে {change} °সে বেশি শীতল | (same) |
| `thenNow.heat.source` | NASA GISTEMP | NASA GISTEMP | (inside the caption) |
| `thenNow.unit.anomaly` | °C compared with the 1951–1980 normal | °সে, ১৯৫১–১৯৮০ সালের স্বাভাবিকের তুলনায় | °C anomaly / °সে বিচ্যুতি |
| `history.unit.heat` | °C compared with the 1951–1980 normal | °সে, ১৯৫১–১৯৮০ সালের স্বাভাবিকের তুলনায় | °C anomaly / °সে বিচ্যুতি |
| `history.sharedCell` | In this data, {places} share one measurement area | এই ডেটায় {places} একই পরিমাপ-এলাকা ভাগ করে নেয় | In this dataset, this is the same grid cell as {places}: one record, not separate places. |

Notes for the reviewer:

- `{change}` is the size of the change, without a sign; the word (warmer / cooler) carries the direction. `{now}` and `{then}` are year ranges such as 2016–2025 and 1981–1990, shown in Bangla digits.
- `{places}` is the page's own place and the others that share its measurement area, as a list in the language ("Dhaka and Chattogram"; in Bangla "ঢাকা এবং চট্টগ্রাম"), made with `Intl.ListFormat`.
- "grid cell" is now "measurement area" (পরিমাপ-এলাকা). The Bangla uses a hyphenated compound; a translator may prefer পরিমাপের এলাকা.
- Rain and water captions on this page, and the Ghost Earths scene's "same grid cell" line (`scenes.ghost.sameRecord`), are unchanged.
