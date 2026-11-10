# ART roadmap: Tier 3 (plans only, no code)

From `docs/prompts/CLAUDE_CODE_PROMPT_art_emotion_musicality.md`, Tier 3. Each plan keeps the rule that never bends:
art may change timbre, harmony underneath, voicing, onset placement, reverb, beds and arrangement; never value → pitch,
the onset count or tempo of a data voice, or any number. Each one needs the pitch-identity check
(`src/lib/art/proof/check.ts`) before it ships, EN + BN strings, braille rules and a flag in the `// >>> ART` block.

## 1. Probes (up to 4 sounding needles) and transect

- **What:** pin up to four needles on the map; each plays its own data voice, panned by its longitude, so two places
  can be compared by ear. A transect: draw a line (or pick two places), hear the values along it as a sweep.
- **Data model:** `AppState.cursor` is one point (`src/components/AppState/reducer.ts`). Add `probes: LatLon[]` (max 4)
  beside it, never replacing it; the live voices stay the needle's.
- **Sound:** the two-data-voice cap holds: the mixer plays the needle plus at most one probe at a time (a "probe
  carousel": each probe sounds for 1 s in turn), never four at once. No new rule: each probe uses its record's rule.
- **Transect:** a sweep (`playSweep`) over points sampled along the great circle; reuses the sweep's step events for the
  map's playhead; Describe gives the endpoints and the highest and lowest values along it.
- **Keys:** none new (CORE_PLAN key map); buttons in the dock's Places menu ("Pin here", "Hear between two places").
- **Tests:** probe values equal `readAt`; the transect's onset count equals the number of samples; axe on the menu.

## 2. The eroded song (interpretation mode)

- **What:** a record's melody played as it was, then "eroded" year by year (notes drop out where a value fell below a
  threshold). Interpretive by design.
- **Gate first:** a listener check of "communicates vs manipulates" (5–10 listeners, /listen-test task): do people
  read it as data or as emotion? Build only if most read it as data.
- **Labels:** "Interpretation, not measurement" on screen and in Describe; never minor key or "sad" timbre; a bad year
  sounds like a good one except for what the value does.
- **Rule:** the remaining notes keep their exact pitch and time; erosion removes onsets, so it is a separate,
  labelled mode, never the default playback, and its onset count is reported.

## 3. The satellite orrery: who is measuring now

- **What:** the satellites behind the records (Aqua, Terra, GPM, GRACE-FO, ISS, S-NPP…) as voices on an orbit clock; a
  satellite that stops (S-NPP fell silent on 2 Nov 2026) goes quiet.
- **Check first:** whether CelesTrak's GP data allows browser fetches (CORS) and its terms allow it; otherwise a
  pipeline job writes `public/data/meta/orbits.json` daily with the TLEs and the source line.
- **Sound:** each satellite a fixed pitch (not data) and a click when it passes over Bangladesh (computed from the
  TLE: `satellite.js`, MIT, licence-check before use). Status from `meta/freshness.json`.
- **Tests:** pass times against a reference propagation; a stale TLE is said to be stale.

## 4. "Flag this moment" (Citizen Ear)

- **What:** while listening, a button (no new key) marks "I heard something here": place, time, frame, value, and a
  short optional note, added to the expedition log (`src/lib/expedition-log.ts`), saved as .txt with the log.
- **Privacy:** stays on the device; nothing is sent. A later opt-in export for a community map is a separate decision.
- **Tests:** the flag's value equals `readAt`; the .txt passes the braille rules.

## 5. People → light → carbon suite

- **What:** a second suite in the Water's journey player (`src/components/Art/Journey`): night lights change
  (5313, relative) → night lights brightness → the CO₂ nature run (5196, relative ppm) → Dhaka's heat (GISTEMP).
- **Sound:** People and carbon's felt piano, then Air for heat; dial at Music; 2 s between datasets; the letter at the
  end. Every step's status said (two are relative: no absolute claims).
- **Reuse:** `buildJourney` takes any list of sources; this is a second source list, not new code.

## 6. Bengali ensemble skin

- **What:** an Instrument style beside Earth Orchestra: dotara, ektara, bansuri, tabla-like clicks and a harmonium
  drone, synthesised (no samples), mapped to the same six Earth systems.
- **Validation:** each skin declares "timbre only" and passes `src/lib/audio/mapping-validate.ts` (no rule changes) and
  the pitch-identity check for every category; a musician reviews the timbres before release.
- **Tests:** as Earth Orchestra's: categories, ≤ 1 cent per family, earcons silent when muted, axe on the legend.
