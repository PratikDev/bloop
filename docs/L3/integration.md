# Integrating L2's Engine and L1's Data with the L3 Interface

For L2 and L1: what the interface expects from you, how to swap in L2's real sound engine, and what's guaranteed not to break.

---

## 1. L2's sound engine in the UI

**Done on `L2-L3-merge` (28 Sep).** Components never import a sound engine directly. They use `audio` from `src/lib/audio-adapter/index.ts`, which now wraps L2's engine:

```ts
// src/lib/audio-adapter/index.ts
import * as l2 from "@/lib/audio";          // L2's index.ts
export const audio: AudioEngine = withFallbacks(l2);
```

L3's interim engine (the rest of `src/lib/audio-adapter/`), the `IS_INTERIM_ENGINE` flag and the "Interim sound engine" badge (and its two strings) are deleted. The adapter keeps only `index.ts`, `types.ts` and `fallbacks.ts`.

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
5. **Mute all and solo apply to every voice**, including Then vs Now and History.
6. **No clicks when sound comes back:** after a fade, the output ramps back up rather than jumping; a sequence started during a fade waits for it.
7. **`ensureAudio()` is only called inside a user gesture** (Start, "Turn sound on").

### Shared helpers L2 uses
L2's audio test page reuses `buildThenNowInput` (`src/lib/then-now.ts`) and `loadDemo`, `loadGrace` (`src/lib/data/context.ts`). L3 gives L2 a heads-up before changing their names or shapes.

### Checklist for the joined app
- [x] `bun x tsc --noEmit`, `bun run lint`, `bun test` (92 pass) and `bun run build` pass on `L2-L3-merge`.
- [x] **One copy of the peak rule:** the time-lapse uses `import { peakFrame } from "@/lib/audio"` (never `@/lib/audio/storm-maths`), and L3's `peakIndex()` is deleted. Before the join, both picked frame 2 (21.6 mm/h) on the real storm and agreed on all 1,176 runs of consecutive frames within the 48, including an all-dry storm (-1: no marker, no peak caption).
- [x] Start → opening → explore: no badge; the opening plays (peak 0.136) and the ocean sounds over the Bay (0.194); silent on dry land.
- [x] Then vs Now: the playhead follows heat, split and water; Stop is silent within 0.25 s, including monsoon (0.000); GRACE gaps are silent with their captions.
- [x] History: "Play the 2010s" moves the playhead; changing decade mid-play stops it.
- [x] Mute all, then Then vs Now: silent (0.000). Solo Ocean: silent; solo off: heard again.
- [x] Esc stops everything: explore, legend, time-lapse, Story (also during loading); "All sound stopped" / "Story stopped. Back to Explore."
- [x] Storm time-lapse: 48 frames, peak caption "22 mm/h" on frame 3, "Time-lapse finished" at the end; the sound-off version still plays. Rain at the heaviest cell: 38.75 drops per second (rule 38.68), longest gap 33.6 ms. Story Mode: 87.8 s with the headless voice (target 60 to 90 s).
- [ ] **Listen by a person, with L2** (the ticks above are signal checks, 28 Sep, headless Edge, `C:\Users\User\nasa-l3-qa`). L2's engine is about 45% louder than the interim one was (Story ocean 0.194 vs 0.133, sweep 0.262 vs 0.178, whisper 0.308 vs 0.204; no clipping): for L2's mix pass.

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
