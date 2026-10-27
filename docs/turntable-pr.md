# Turntable Earth prototype (draft PR description)

## Summary

Adds **Turntable**, a fourth mode tab: the latest EIC frame on a globe that turns under a fixed tonearm. The needle reads the point beneath it and plays it with the existing ocean, rain and snow voices and the existing `mapping.json` rules. Longitude changes as the globe turns, and the needle's groove sets latitude. Three live records (Ocean, Rain, Ocean + Rain) are the app's existing track modes. Eight more EIC areas show as disabled "Coming next" cards with no data and no sound.

Prototype for feel; no new data, no pipeline change, no mapping change.

## User-visible impact

- New **Turntable** tab. three.js (`three@0.186.1`) loads only when it is opened, so the other modes' first load doesn't include it.
- Keys on the turntable: ←/→ turn, ↑/↓ needle latitude (±80°), Space turn/stop, Enter speak, R/Shift+R and 1/2/3 records, +/− speed, Esc back to the flat map. Drag to turn; click a point to bring it under the needle. The other map letters keep their meaning. Help lists the new keys.
- **Flat map** returns to Explore at the needle's lat/lon, with keyboard focus on the map.
- Record labels read from `sst.json` / `rain.json`: dataset, SVS ID, frame time (UTC), "Latest available: N days old", and the measured error as the Truth panel shows it (Ocean: "Verification being updated"; Rain: "~27%, pending team approval").
- New earcon on record change ("needle drop"), captioned. It is a UI cue, not data.
- Esc on the turntable stops all sound (as before) and returns to Explore, like Story.

## Shared files touched (kept minimal)

- `AppState/reducer.ts`: `Mode` gains `"turntable"`. The existing "live sound may play" test is named `liveSoundOn()` (same logic).
- `Commands/use-commands.ts`, `Commands/index.tsx`: mode label; `speakAt(at)` (`speakCurrent` now calls it with the cursor); Esc leaves the turntable.
- `Commands/use-sound-sync.ts`: exports `playReading()` (the two `audio.set*` calls Explore already made). In Turntable mode the needle loop feeds the voices; Explore is unchanged.
- `ExploreControls/use-map-keys.ts`: exports existing tables for reuse; no behaviour change.
- `HelpDialog.tsx`: key table extracted into `KeyTable`, plus an "On the turntable" table. The existing table is unchanged.
- `ModeTabs.tsx`, `JukeboxApp/index.tsx`, `i18n/index.ts`: the tab, the lazy view, the new strings.
- `audio-adapter/types.ts`, `fallbacks.ts`, `interim-engine.ts`, `earcons.ts`: `playNeedleDrop()` as an optional L3 extension (PROPOSAL, no-op fallback). It plays on the earcon bus, so the master cap and limiter apply.

## Schema, config, environment

- **Schema / data contract:** none. **`mapping.json`:** unchanged. **Pipeline / data files:** none. **Environment variables:** none.
- **Dependencies:** `three@0.186.1`, `@types/three@0.186.0` (dev).
- **Scripts:** `test` → `bun test` (first unit test: `src/lib/sphere.test.ts`).

## Validation

- `bun run lint`, `bunx tsc --noEmit`, `bun run build`: pass. `bun run test`: 8/8.
- Production build in headless Edge (Playwright): needle = flat-map value for 5 random ocean and 2 land points; Dhaka is land/no SST; 18° N 88° E reads 28.9 °C; 0° N 0° E is ocean. Ocean pitch at one point is identical after turning at 0.5×, 1× and 4×. Rain and snow rates match the rule at 4 points (within 1%). No click on record switch. FPS 144 (display cap), 96–113 with 4× CPU slowdown. No heap growth over 40 record switches; reopening levels off after a three.js `DFG_LUT` leak was found and fixed (Lambert material on the deck). Existing modes and the keyboard-only run pass, with no console errors. Full numbers and screenshots: `docs/turntable.md`, `docs/turntable-screens/`.
- Manual: open the Turntable tab, try keys, drag and click; `?debug=1` shows the 3D/2D comparison.

## Known limitations

See `docs/turntable.md`: grid-cell-edge rounding in the debug camera pick, drop-timer restarts while turning over changing rain (existing voice behaviour), Esc message replaced by Explore's reading announcement, English-only strings, not yet tested on phones or with a screen reader.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
