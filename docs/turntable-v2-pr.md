# Turntable Earth v2: realistic globe, places and readable UI (draft PR)

## Summary

Rebuilds the Turntable's presentation. The globe is now a realistic NASA Blue Marble / Black Marble Earth with a sun-at-frame-time terminator, with the EIC data frame on its own layer above it (land cut by the grid's mask, opacity 0–100%, default 85%). You can find any place: Natural Earth borders, rivers, seas and ranked bilingual labels, Bangladesh districts, offline search, "Where am I?", bookmarks, a tour, zoom to district level and an inset map. The turntable is redesigned in PBR with record sleeves, a readout card, a legend and gentle motion. **Data, `valueAt()`, the sound mapping and every value are unchanged** (verified point-by-point against v1).

## User-visible impact

- Two camera modes (Jukebox / close-up) with eased flights; drag, click, wheel and pinch.
- New keys on the Turntable: / or G search, L where am I (Shift+L legend), 1–9 bookmarks, T tour, + / − zoom, [ ] speed, V view, O data opacity. Esc stops a tour or flight, or closes search, before its global meaning. Help is updated.
- Record sleeves (cover = the frame; flip for dataset, SVS ID, frame time, age, measured error); "coming next" areas shown locked.
- Enter now speaks value + unit + place + "frame time … UTC, latest available".
- Credits strip; "Background: Blue Marble composite, not today's clouds".
- Shared fixes: caption wraps to two lines instead of being cut; the dev-only Next.js badge is off (`devIndicators: false`); the side panel folds away in Turntable mode only.

## Schema, config, environment

- **Data contract, `mapping.json`, pipeline:** unchanged.
- **New static assets:** `public/textures/` (WebP 2048/4096/8192, 3.9 MB total in the repo; 1.06 MB loaded at the default 4096) and `public/geo/` (1.6 MB), rebuilt by `scripts/fetch-basemap.mjs` and `scripts/build-geo.mjs`; sources and licences in each `SOURCES.json`.
- **Dev dependencies:** mapshaper 0.7.98 (MPL-2.0), sharp 0.35.4, fflate, astronomy-engine 2.1.19 (MIT, tests only). No new runtime dependency.
- **Config:** `next.config.ts` `devIndicators: false`.
- **App state:** `panelCollapsed` (Turntable only). **Audio:** the needle-drop earcon gains a soft crackle (earcon bus; master cap and limiter unchanged).
- **Bangla:** Turntable-only draft table; `bn.ts` and `<html lang>` untouched.

## Validation

- `bun run lint`, `bunx tsc --noEmit`, `bun run build`: pass. `bun run test`: 22/22 (mapping, sun position vs astronomy-engine within 0.005°, gazetteer, search).
- Values: 7 points bit-identical to v1 and to the flat map. Labels within 1.4e-14°. Search lands within 6e-14°. Reverse lookup: Bay of Bengal, Dhaka, Natural Earth's "South Atlantic Ocean" at 0/0, Satkhira District.
- Audio: pitch identical at 0.5×/1×/4×; particles = audio drop rate within 1%; no click on record switch.
- Accessibility: Lighthouse 100, axe 0 violations (EN and বাংলা), keyboard-only run 11/11, contrast ≥ 5.5:1 for all text.
- Performance: 144 FPS; 60–82 (Jukebox) and 41–64 (close-up) with 4× CPU slowdown; no heap growth; tab download 3.29 MB.
- Regression: all existing modes pass; no console errors.
- Details and screenshots: `docs/turntable.md`, `docs/turntable-v2-screens/`.

## Known limitations

Bangla strings are drafts for a translator; Natural Earth river naming in Bangladesh (Padma/Jamuna appear as Ganges/Brahmaputra, Meghna unnamed); the SWOT reach isn't chosen yet; coastline vs data mask disagree on 27% of coastal cells (1.7% globally), and the grid decides; not yet tested on a real phone or by screen-reader users.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
