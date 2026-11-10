# ART: art, emotion and musicality

Built on `wt/art` (10 Nov 2026) from `docs/prompts/CLAUDE_CODE_PROMPT_art_emotion_musicality.md`: Tier 1 (items 1–6)
and Tier 2 (items 7–9) in full; Tier 3 as plans (`docs/statement/ART_ROADMAP.md`). Row-by-row status:
`docs/statement/ART_PARAGRAPH_STATUS.md`.

## The rule that never bends

Art may change timbre, harmony underneath, voicing, reverb, background beds and arrangement; never the value → pitch
rule, a data voice's onset count or tempo, or any number. How the code keeps it:

- **Timbre only.** Every Earth Orchestra family is a set of harmonic spectra on oscillators at exactly the note's
  frequency (one ConstantSource drives every layer of a note); the live voices keep their own oscillator and only get
  `setPeriodicWave` (timbre) — their frequency param is never touched (`src/lib/art/live/dress.ts`).
- **Swara + meend** changes the path into a note, never where it settles: an exponential ramp that lands exactly on the
  data pitch after 0.12 s, only where notes last ≥ 0.25 s.
- **Layers sound only while data does** (bed, drone): silence still means no data. No layer is routed into a data voice.
- **The check.** `src/lib/art/proof`: a record's own values through its rule, rendered offline (OfflineAudioContext)
  with the art off, at 0, 0.5 and 1, and at 1 in a monsoon month; the data voice on its own channel; its settled pitch
  per note measured from the audio (a fine search of the Hann-windowed spectrum); onsets and tempo from the renderer's
  log. Pass: logged pitches identical, measured pitch within 1 cent of the art-off render and of the rule, the same
  onsets and tempo. It runs in CI (e2e/art) and from the dial's "Check the data voice" button.
- No minor key, no "sad" sound for bad news: nothing here looks at whether a value is good or bad.
- "Interpretation, not measurement" labels the Earth Orchestra legend, the dial and Water's journey.

## What was built, and the statement phrase each answers

| Piece | Where | Answers |
|---|---|---|
| Earth Orchestra: a synthesised instrument family per Earth system (Ocean: breathy flute; Air and weather: soft pad; Land and life: plucked string; Fire and smoke: muted metallic pluck with crackle; Ice and water storage: glassy bell; People and carbon: felt piano), the Instrument style setting, a 0.4 s category earcon, the Official grid grouped by system, the legend card, Describe leading with the system | `src/lib/audio/orchestra`, `src/components/Art/Orchestra`, Settings, How we know | "musically pleasing", "blending scientific data with artistic expression", "multi-sensory" |
| Science to Art dial: Measure (plain tones + gridline ticks), Blend (instrument, bed, value chord), Music (+ drone on Sa, reverb, swara + meend); the line "Data voice: unchanged at every position. What changes: …"; the check | Settings, Official records, How we know | "balance data interpretation with artistic, musically pleasing outputs", "musical scales, or harmonies", "interactive", "exploratory" |
| Raw pixel vs Bloop, measured | How we know | "a direct pixel-to-sound translation might result in chaotic noise" |
| A letter to the future | Listen, the tour's end, Water's journey's end | "deeper emotional connection to our home planet" |
| The song of your lifetime (+ MIDI) | Then vs Now › Your lifetime | "deeper emotional connection", "bridge this gap" |
| Data vs artistic choice, per record | About this sound, How we know, Official records | "blending scientific data with artistic expression" |
| The tour names every dataset | Listen › Take the tour | "bridge this gap" |
| Emotion ratings and ear vs eye in /listen-test | /listen-test | "subtle data patterns that might be missed by the naked eye", "deeper emotional connection" (measured, never claimed) |
| Water's journey (Tier 2) | Listen › Water's journey | "translation from sight to sound is exploratory", "blending scientific data with artistic expression" |
| MIDI for a human performer (Tier 2) | Then vs Now (any part), Your lifetime | "artistic expression" |
| The drone's season colour (Tier 2) | the dial at Music | "musically pleasing" |

## Pitch-identity results

The CI test (`e2e/art/dial.e2e.ts`) prints one `PITCH-IDENTITY` line per record; this table is that run (10 Nov 2026,
production build with every `NEXT_PUBLIC_ART_*` flag, Chromium). Limit: 1 cent. Largest difference over all of the
record's notes, in cents, between the data voice's measured settled pitch and the rule ("vs rule"), and the art-off
render ("vs art off"). Onsets: the data voice's note count (tempo is the same in every row: the renderer's log).

| Record | Setup | Timbre | Onsets | vs rule (cents) | vs art off (cents) |
|---|---|---|---|---|---|
| ocean (live SST) | art off | plain | 24 | 0.0001 | 0 |
| | 0 Measure | Ocean | 24 | 0.0001 | 0 |
| | 0.5 Blend | Ocean | 24 | 0.0084 | 0.0085 |
| | 1 Music | Ocean | 24 | 0.0139 | 0.0139 |
| | 1 Music, monsoon month | Ocean | 24 | 0.0139 | 0.0139 |
| rain (IMERG) | art off | plain | 484 | 0 | 0 |
| | 0 Measure | Air and weather | 484 | 0 | 0 |
| | 0.5 Blend | Air and weather | 484 | 0 | 0 |
| | 1 Music | Air and weather | 484 | 0 | 0 |
| | 1 Music, monsoon month | Air and weather | 484 | 0 | 0 |
| currents_3912 | art off | plain | 24 | 0.0001 | 0 |
| | 0 Measure | Ocean | 24 | 0.0001 | 0 |
| | 0.5 Blend | Ocean | 24 | 0.0189 | 0.0188 |
| | 1 Music | Ocean | 24 | 0.0228 | 0.0228 |
| | 1 Music, monsoon month | Ocean | 24 | 0.0228 | 0.0228 |

Rain is a rate voice (drops, no pitch; its cents columns are 0 by construction): its check is the drop count (484)
and tempo (within 0.005 s), the same at every stop. The same test
also checks every Earth Orchestra family, as the live voice and as OrchestraApi notes, against the art-off render on
the live SST plan (all within the limit). Water's journey's WAV is bit-identical render to render (two renders, 0
differing samples; see `src/lib/audio/orchestra/mix.ts` for why the offline graph sums two inputs at a time).

## Raw-pixel numbers (measured, `public/data/art/raw_pixel.json`)

SVS 3912, sea surface temperature, 25 Mar 2007, 6 s each, 22 050 samples a second, 2048-sample frames that sound:

| | Spectral flatness | Spectral entropy | Roughness |
|---|---|---|---|
| Naive (pixel hue → pitch) | 0.0007919 | 0.4611 | 0.8993 |
| Bloop (the ocean rule) | 1.133e-9 | 0.1517 | 0.002915 |

Flatness: geometric over arithmetic mean of the power spectrum. Entropy: Shannon entropy of the normalised power
spectrum over log(bins). Roughness: Sethares' (1993) form of the Plomp–Levelt curve,
a1·a2·(e^(−3.5·s·Δf) − e^(−5.75·s·Δf)), s = 0.24 / (0.0207·f_min + 18.96), summed over every pair of each frame's 20
strongest peaks (amplitudes normalised to the frame's strongest), averaged over the frames.

## Category table

Generated by `scripts/orchestra-categories.ts` into `src/lib/audio/orchestra/categories.json` from the Official and
Related indexes, each manifest's title and layer labels, and the Listen / Then vs Now voices (mapping.json). Ordered
keyword rules (`classify.ts`); a record with no match, or whose layers fall into different systems, is left unplaced.

- **Ocean**: ocean (live SST), currents_3912, ocean2_5425, rel_3821, rel_3913, rel_4332, rel_4345, rel_4353, rel_5017,
  rel_5111, rel_5221, rel_5235, rel_5516, rel_5611, rel_oisst.
- **Air and weather**: rain, snow, heat (GISTEMP), monsoon, eic_5147, eic_5148, eic_5149, eic_5150, lightning_5011,
  river_4960, rel_3143, rel_3144, rel_4272 (the ozone layer), rel_4284, rel_4372, rel_4417, rel_4445, rel_4939,
  rel_5190, rel_5191, rel_5207, rel_5209, rel_5468, rel_5650.
- **Land and life**: eic_5544, forest_4950.
- **Fire and smoke / air quality**: aerosols_5669, air_5533, eic_5151, eic_5152, eic_5153, eic_5154, rel_4764,
  rel_4810, rel_4993, rel_5070, rel_5104, rel_5142, rel_5303, rel_5453, rel_5557, rel_5597, rel_5601, rel_5624, rel_5639.
- **Ice and water storage**: water (GRACE), rel_4889, rel_5098.
- **People and carbon**: co2_5196, lights_5313, rel_30919, rel_4658, rel_5110, rel_5119, rel_5126, rel_5477.
- **Unplaced (plain tones)**: patterns_eic (layers in different systems), rel_gibs (any GIBS layer: mixed).

DATA's new records: re-run the script at integration; a record the rules can't place is listed, never guessed.

## Honest wording

- **Say:** "the data voice never changes; the dial only changes the instruments around it"; "Earth Orchestra: each Earth
  system has its own instrument family"; "a letter to the future, written only with measured values".
- **Never say:** "emotional AI", "the Earth's real voice", "proves sound reveals what eyes miss" (unless the listener
  test shows it, with n), "music that represents climate grief".
- The ear-vs-eye task and the emotion ratings are formative (5–10 listeners); no result is shown in the app.

## Known limits

- Rain and snow keep their drops and bells at every stop (rate voices: the family is heard on the pitched voices).
- The value chord is CV's: until integration the hook is empty and the dial says "not available in this version".
- Swara + meend's "1 step = measured error" legend is not built (it needs a per-record error in pitch units).
