# Integrating L2's Engine and L1's Data with the L3 Interface

For L2 and L1: what the interface expects from you, how to swap in L2's real sound engine, and what's guaranteed not to break.

---

## 1. Swapping in L2's sound engine

Components never import a sound engine directly. They use `audio` from `src/lib/audio-adapter/index.ts`. Switching engines is **one file**:

```ts
// src/lib/audio-adapter/index.ts
import * as l2 from "@/lib/audio";          // L2's index.ts
export const audio: AudioEngine = withFallbacks(l2);
export const IS_INTERIM_ENGINE = false;     // removes the "Interim sound engine" badge
```

Then run `bun run lint` and `bun run build`.

### Why this can't break silently
- **Source of truth:** L2's API names and shapes in `docs/L2/BUILD_PLAN.md` §2 (and §8). **`L2AudioApi`** (in `src/lib/audio-adapter/types.ts`) mirrors exactly the part of that API the UI calls, including `playSeries` (B6, accepted by L2 on 28 Sep). If L2's exports differ in any name or argument shape, `withFallbacks(l2)` **fails the type check**, so `bun run build` fails before anything ships. L2 has already checked that `withFallbacks(l2)` type-checks against its branch.
- **New needs go through a proposal first.** If L3 needs a new function, event or parameter, it is added to `contract-proposals.md` §B (like B1 to B7) and only used once L2 agrees, or behind a fallback that degrades safely.
- **`L3AudioExtensions`** are the extras still being requested (B1, B3). They're optional. `withFallbacks()` fills any that are missing, and the UI degrades rather than breaking:

| Missing from L2's engine | What happens |
|---|---|
| `getAnalyser()` (B1) | The waveform is a flat line. Rings, sweep and chart playheads run on a local clock and show events as they arrive. |
| Drop events (B2) | Rain ripples don't draw. Ocean rings and the static reduced-motion ring still work. |
| `setVoiceVolume()` (B3) | Volume sliders do nothing; mute and solo still work. |

`playSeries()` no longer has a fallback: it's part of `L2AudioApi`.

### What the UI relies on (please keep these behaviours)
1. **Step events count data points only** (B5, accepted by L2):
   - Heat and monsoon: index 0 to 19 (window A, then B).
   - Water: the month index into `ThenNowInput.water.months`.
   - Silent gaps between windows emit no step event; `total` is the number of data points.
   - `player` names: `"thenNow.heat" | "thenNow.monsoon" | "thenNow.water"`, `"compare"`, `"compare.split"`, `"sweep"`, and whatever `playSeries` is given (`"history"`).
2. **Captions:** `AudioEvent` `{ kind: "caption", key, params }`. The UI turns each key into text in both languages (`src/lib/i18n/en/captions.ts`). An unknown key shows as its raw name: visible, but never a crash.
   - **Agreed set for Then vs Now** (B7, 28 Sep): `caption.thenNow.caption {text}`, `caption.thenNow.window {label}`, `caption.thenNow.end`, `caption.water.gap {from, to}`, `caption.water.windowStart {month}`, `caption.water.windowEnd {month}`, `caption.compare.side {label}`, `caption.compare.useHeadphones {a, b}`.
   - **Live exploration keys the interim engine sends today** (for L2's reference, not yet agreed): `caption.value {track, value, phase?}`, `caption.nodata {track}`, `caption.sweep.start`, `caption.sweep.end`, `caption.legend {voice, label}`, `caption.legendUnavailable {voice}`, `caption.warmup.start`, `caption.warmup.end`, `caption.motif`, `caption.opening.closeEyes`, `caption.opening.openEyes`, `caption.stopped`, `caption.earcon.nodata`, `caption.earcon.whisper {source}`, `caption.earcon.ping`, `caption.noBanglaVoice`, `caption.noSpeech`.
   - **Any new key needs a heads-up in both directions** before it's sent or expected.
3. **`PlayerHandle.done` resolves** when the player finishes **or** is stopped. The UI uses it to release the view.
4. **Stopping early silences everything the player owns**, including sounds already scheduled ahead (for example monsoon drops), and `stopAll()` resolves every open `done`.
5. **Mute all and solo apply to every voice**, including Then vs Now and History (the interim engine routes them through the mixer).
6. **No clicks when sound comes back:** after a fade, the output ramps back up rather than jumping; a sequence started during a fade waits for it.
7. **`ensureAudio()` is only called inside a user gesture** (Start, "Turn sound on").

### Shared helpers L2 uses
L2's audio test page reuses `buildThenNowInput` (`src/lib/then-now.ts`) and `loadDemo`, `loadGrace` (`src/lib/data/context.ts`). L3 gives L2 a heads-up before changing their names or shapes.

### Checklist when the real engine lands
- [ ] `bun run build` passes with the one-file swap above.
- [ ] Run the app. The badge is gone, and Start → opening → explore sounds as before.
- [ ] Then vs Now: the playhead follows the sound for all three parts, and Stop is silent (including monsoon).
- [ ] History: "Play the 2010s" moves the playhead.
- [ ] Mute all (M on the map), then Then vs Now: silent.
- [ ] Esc stops everything, from every mode.
- [ ] **Use L2's `peakFrame()` and delete our `peakIndex()`** (one copy of the peak rule). L2's is in `src/lib/audio/storm-maths.ts`, which only exists on `L2-audio-engine`, so this waits for the swap. Other lanes import only from `@/lib/audio`, and L2 exports `peakFrame` from there, so always use `import { peakFrame } from "@/lib/audio"` (never `@/lib/audio/storm-maths`). Steps:
  - `src/lib/audio-adapter/timelapse.ts`: L2's engine has its own `playTimelapse`, which already uses `peakFrame`. If the interim engine is removed, this file goes with it; if it stays as a backup, import `peakFrame` here instead.
  - `src/components/TimeLapse/index.tsx`: import `peakFrame` from `@/lib/audio` instead of `peakIndex`.
  - `src/lib/data/storm.ts` and `src/lib/data/index.ts`: delete `peakIndex` and its export.
  - **Already checked (28 Sep):** on the real storm, both pick frame 2 (21.6 mm/h), and they agree on all 1,176 runs of consecutive frames within the 48. There used to be one difference: when every frame was dry, ours returned the first dry frame (so the caption and Story said "heaviest: 0 mm/h") and L2's returned -1. Ours now skips dry points too, so it also returns -1. The time-lapse already treats -1 as "no peak" (no marker, no peak caption), so nothing else changes.

### Drop rate (fixed in the interim engine, 28 Sep)
L2 found that re-drawing a drop's timing on every rate change made rain too dense. The interim engine had the same bug: dragging over light rain played 6.2 to 6.6 drops per second where the rule gives 5.64 (+9 to 17%). It's now fixed the same way as L2's (each drop's timing is drawn once; a rate change only re-times it). After the fix: 5.67 to 5.83 while dragging, 38.67 at the heaviest cell (rule 38.68), and the storm time-lapse within 2% of the rule. The storm time-lapse was already within 2% before the fix. The swap to L2's engine brings L2's own fix, so nothing more is needed then.

---

## 2. L1's data files

- **Shapes:** everything the UI reads is typed in `src/types/data-contract.ts` (L1's file). The UI reads only what those types list.
- **Checked on load:** `src/lib/data/validate.ts` checks the fields each view needs, and the grid decoder checks the encoding name and byte size.
- **If a file changes shape:** the view shows a plain error ("Couldn't load…") and the rest of the app keeps working. A changed file can't crash the app halfway through a demo.
- **Contract changes:** a change to a JSON shape needs the same change in `data-contract.ts`, as the contract already says. The type check then shows every place in the UI that must follow.
- **Captions:** the UI shows demo captions exactly as the JSON gives them. Fixing their wording in the JSON fixes it on screen; no UI change is needed.

---

## 3. Keeping branches merge-clean
**Before touching a shared file, check with the other lane.** The full table is in `contract-proposals.md` §B4. In short:
- **L2 owns:** `public/mapping.json`, `src/lib/audio/**`, the contract §10 mapping types, the `package.json` **scripts** (including `"test": "bun test"`; L3 won't add another), and the shadcn components `badge`, `card`, `label`, `select`, `switch` (L3 won't add these; it reuses L2's once merged).
- **L3 owns:** the re-themed shadcn components `dialog`, `sheet`, `slider`, `tabs`, `toggle`, `toggle-group`, `tooltip`, `chart`, and the helpers L2 reuses (`buildThenNowInput`, `loadDemo`, `loadGrace`).
- **`bun.lock`:** both lanes added packages at the same place, so it conflicts once. L2 merges into `main` first; resolve the conflict by regenerating the lockfile with `bun install` (or taking L3's lockfile). Never merge one lane's branch into another.
