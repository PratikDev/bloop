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
- **`L2AudioApi`** (in `src/lib/audio-adapter/types.ts`) is exactly the part of `docs/L2/BUILD_PLAN.md` §2 and §8 that the UI calls. If L2's exports differ in any name or argument shape, `withFallbacks(l2)` **fails the type check**, so `bun run build` fails before anything ships.
- **`L3AudioExtensions`** are the extras L3 asked for (`contract-proposals.md` §B). They're optional. `withFallbacks()` fills any that are missing, and the UI degrades rather than breaking:

| Missing from L2's engine | What happens |
|---|---|
| `getAnalyser()` | The waveform is a flat line. Rings, sweep and chart playheads run on a local clock and show events as they arrive. |
| Drop events | Rain ripples don't draw. Ocean rings and the static reduced-motion ring still work. |
| `setVoiceVolume()` | Volume sliders do nothing; mute and solo still work. |
| `playSeries()` | Place History plays through `playCompare()` with an empty second side. |

### What the UI relies on (please keep these behaviours)
1. **Captions:** `AudioEvent` `{ kind: "caption", key, params }`. The UI has English text for every key the interim engine emits (`src/lib/i18n/en/captions.ts`). A new key shows as its raw name until L3 adds text, so it's visible but never crashes.
2. **Step events count data points only** (proposal B5):
   - Heat and monsoon: index 0 to 19 (window A, then B).
   - Water: the month index into `ThenNowInput.water.months`.
   - Silent gaps between windows emit no step event.
   - `player` names: `"thenNow.heat" | "thenNow.monsoon" | "thenNow.water"`, `"compare"`, `"compare.split"`, `"sweep"`, and whatever `playSeries` is given (`"history"`).
3. **`PlayerHandle.done` resolves** when the player finishes **or** is stopped. The UI uses it to release the view.
4. **Stopping early silences everything the player owns** (the interim engine's `onStop`), and `stopAll()` resolves every open `done`.
5. **`ensureAudio()` is only called inside a user gesture** (Start, "Turn sound on").

### Checklist when the real engine lands
- [ ] `bun run build` passes with the one-file swap above.
- [ ] Run the app. The badge is gone, and Start → opening → explore sounds as before.
- [ ] Then vs Now: the playhead follows the sound for all three parts, and Stop is silent.
- [ ] History: "Play the 2010s" moves the playhead.
- [ ] Esc stops everything, from every mode.

---

## 2. L1's data files

- **Shapes:** everything the UI reads is typed in `src/types/data-contract.ts` (L1's file). The UI reads only what those types list.
- **Checked on load:** `src/lib/data/validate.ts` checks the fields each view needs, and the grid decoder checks the encoding name and byte size.
- **If a file changes shape:** the view shows a plain error ("Couldn't load…") and the rest of the app keeps working. A changed file can't crash the app halfway through a demo.
- **Contract changes:** a change to a JSON shape needs the same change in `data-contract.ts`, as the contract already says. The type check then shows every place in the UI that must follow.
- **Captions:** the UI shows demo captions exactly as the JSON gives them. Fixing their wording in the JSON fixes it on screen; no UI change is needed.

---

## 3. Keeping branches merge-clean
- **Byte-identical copies:** L3 carries L2's `mapping.json`, `mapping.ts` and the contract §10 types unchanged from L2's branch.
- **`bun.lock`:** L2 and L3 both added packages, at the same place in the lockfile. L2 merges into `main` first. If the lockfile conflicts, regenerate it with `bun install` and commit the result; don't merge one lane's branch into another. Details are in `contract-proposals.md` §B4.
- **shadcn components:** L3 owns the re-themed components in `src/components/ui/`. Please reuse them rather than re-adding them.
