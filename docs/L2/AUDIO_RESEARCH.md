# Earth Information Jukebox: Audio Engineering Research

**Owner:** L2 (Audio) · **Readers:** whole team · **Version:** 27 Sep 2026
**Status:** Part A (browser engineering) researched · Part B (what people can hear) started · Part C (accessibility audio) planned

> **Read this first.** Section 1 says what this research is for. Section 4 is ready to code from today. Section 7 is the ear tests to run before Tuesday's freeze. Every claim has a source link or is labelled as our own design choice or estimate. Nothing in this doc goes on screen or in the video as a fact unless it comes from a cited source or our own recorded test.

---

## Contents

1. Goal and scope
2. Decisions already made
3. The three research tracks
4. Part A: Browser engineering (findings, ready to code)
5. Part B: Sonification design (what people can actually hear)
6. Part C: Accessibility audio
7. Ear tests (run before the freeze)
8. Schedule
9. Findings log template
10. What L2 hands to the other lanes
11. Research honesty rules
12. Sources (verified) and things still to verify

---

## 1. Goal and scope

**Goal:** make sure every sound in the Jukebox is (1) technically clean in a browser, (2) actually understandable by a listener, and (3) usable by blind and low-vision (BLV) people.

**This research produces decisions, not essays.** Every finding must end in something L2 can code or something the team can test.

**In scope**
- How `lib/audio.ts` should be built (Web Audio API).
- How data values should map to sound (`mapping.json`).
- How sound, speech and captions work together.
- How it behaves on phones.

**Out of scope for now**
- The October listening study itself (this doc only prepares for it).
- Music styles and raga skins (October roadmap).

---

## 2. Decisions already made

| Decision | Why |
|---|---|
| Sound is generated from the **EIC frame** (colour → value → sound). | Literal challenge ask ("pairs EIC visual frames with dynamic sonifications generated in real time") and our main differentiator. |
| A **"Hear NASA's source data"** toggle comes in **October**, not before Video 1. | Useful demo of verification by ear, but not worth risking the 30 Sep deadline. |
| Aim to cover **every EIC daily category** (23 in the SVS gallery), each with a **status badge**. | Badges keep us honest: *Verified*, *Converted, not yet verified*, *Picture only*. |
| Real time means **the sound is synthesised live**; the data is near-real-time. | Matches the challenge wording and our honesty rules (frame time always shown). |

---

## 3. The three research tracks

| Track | Question | When | Output |
|---|---|---|---|
| **A. Browser engineering** | How do we make sound clean, on time, safe, and working on phones? | **Now** (Sun 27) | Coding patterns in Section 4 |
| **B. Sonification design** | Can people hear the differences we are encoding? Which sound means what? | Quick checks Mon 28, depth in October | Updated `mapping.json`, sound families, pilot questions |
| **C. Accessibility audio** | Can a BLV user explore, understand and trust it without seeing? | Basics before freeze, depth in October | Legend, ducking, no-data cue, keyboard audio behaviour |

---

## 4. Part A: Browser engineering (ready to code)

Confidence scale used below: **High** = official docs or spec. **Medium** = consistent developer practice but no official guarantee. **Low** = our assumption, must be tested.

### A1. Changing pitch and volume without clicks

**Findings**
- Once an `AudioParam` has scheduled changes, assigning `.value` directly is ignored. ([MDN: AudioParam](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam)) **High**
- `setTargetAtTime` moves exponentially toward the target; after one time constant it has covered about 63% of the distance. **High**
- Exponential ramps do not work when the current or target value is 0. **High**

**Decision**
- Use `setTargetAtTime` for every glide. Never set `.value` after scheduling.
- For the ocean voice's 30 ms glide, use a time constant of **0.01 s**. After three time constants (30 ms) it reaches about 95% of the target (1 − e⁻³ ≈ 0.95; our calculation).
- Fades to silence: `setTargetAtTime(0, ...)` or a linear ramp. Never an exponential ramp to 0.

```ts
// lib/audio.ts
export function glideTo(ctx: AudioContext, param: AudioParam, target: number, glideSec = 0.03) {
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);        // start from where it is now
  param.setTargetAtTime(target, now, glideSec / 3); // ~95% of the way by glideSec
}
```

### A2. Timing fast events (raindrops, monthly steps)

**Findings**
- `setTimeout` / `setInterval` run on the main thread and can slip when the page is busy; the audio clock runs separately and is precise. ([web.dev: A tale of two clocks](https://web.dev/articles/audio-scheduling), Chris Wilson, 2013) **High**
- The standard pattern: a JavaScript timer wakes every ~25 ms and hands the audio engine every event due in the next ~100 ms, timed against `AudioContext.currentTime`. **High (pattern)**
- One open-source project found 100 ms was not enough on a phone and raised it to 200 ms. ([alden12/web-daw PR #119](https://github.com/alden12/web-daw/pull/119)) **Low (one project's experience)**

**Decision**
- Build **one shared scheduler** for rain drops, monthly steps (Then vs Now, Place History), fire clicks and story cues.
- Start at 25 ms / 100 ms. If drops stutter on Android, raise the look-ahead to 200 ms.
- Never drive sound timing from React state, `useEffect` intervals, or animation frames.

```ts
// lib/audio.ts (sketch)
const TICK_MS = 25;
let scheduleAheadSec = 0.1; // raise to 0.2 if phones stutter
let nextTime = 0;

function tick(ctx: AudioContext) {
  while (nextTime < ctx.currentTime + scheduleAheadSec) {
    playNextEvent(nextTime);          // e.g. playDrop(nextTime, gain)
    nextTime += nextIntervalSec();    // from current rain rate or step length
  }
}
// start: nextTime = ctx.currentTime + 0.05; setInterval(() => tick(ctx), TICK_MS);
```

### A3. Audio will not start without a user action

**Findings**
- If an `AudioContext` is created before the user interacts, it starts **suspended**; you must call `resume()` after a click or key press. ([Chrome: Autoplay policy](https://developer.chrome.com/blog/autoplay)) **High**
- MDN recommends creating **one** `AudioContext` and reusing it. ([MDN: AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)) **High**

**Decision**
- Create the context lazily on the first user action and reuse it everywhere.
- The "Close your eyes" opening (C1) needs a **Start** button. It must be the first focusable element, with a clear label for screen readers.

```ts
let ctx: AudioContext | null = null;

export async function ensureAudio(): Promise<AudioContext> {
  ctx ??= new AudioContext({ latencyHint: "interactive" });
  if (ctx.state === "suspended") await ctx.resume();
  return ctx;
}
// Call ensureAudio() inside the Start button's click/keydown handler.
```

### A4. Raindrops at up to 40 per second

**Findings**
- An `AudioBufferSourceNode` plays once, is cheap to create, and the same `AudioBuffer` can be reused; "fire and forget" use is normal. ([MDN: AudioBufferSourceNode](https://developer.mozilla.org/docs/Web/API/AudioBufferSourceNode)) **High**

**Decision**
- Create **one noise buffer** at startup.
- Per drop: new source → short gain envelope → **shared** band-pass filter → rain bus.
- Performance on low-end Android is **our assumption**; test it (Section 7, T6).

```ts
export function playDrop(ctx: AudioContext, noise: AudioBuffer, rainFilter: AudioNode,
                         time: number, peak: number) {
  const src = new AudioBufferSourceNode(ctx, { buffer: noise });
  const env = new GainNode(ctx, { gain: 0 });
  src.connect(env).connect(rainFilter);
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(peak, time + 0.002); // 2 ms attack, avoids clicks
  env.gain.setTargetAtTime(0, time + 0.002, 0.015);     // quick natural decay
  src.start(time);
  src.stop(time + 0.1);
}
```

**Design choice (to test):** small random variation in drop timing sounds more like real rain than a metronome. The **average** rate must still equal the mapping rule (2 + 38·t drops/s), so the data stays honest.

### A5. Volume safety

**Findings**
- Developers commonly use `DynamicsCompressorNode` as a master limiter, but we found **no official source** guaranteeing it stops every overshoot. **Medium**
- A web page cannot know how loud the user's device is set. (Our reasoning; no source needed.) **High**

**Decision**
- **Gain staging is the real cap.** The maximum gains of all voices that can play together must add up to less than 1.0 before the master.
- The compressor is a **safety net** only.
- Every sound fades in (A1). No sudden starts at full level.
- The 30-second warm-up asks the user to set a comfortable volume before anything else plays.

**Starting values (our untested defaults, tune by ear):**

| Node | Start value |
|---|---|
| Per-voice max gain | 0.25 (up to 3 voices at once → 0.75 total) |
| Master gain | 0.8 |
| Compressor | threshold −6 dB, ratio 20, attack 0.003 s, release 0.25 s |

### A6. Speech on top of sound

**Findings**
- `SpeechSynthesisUtterance` fires **start** and **end** events. ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance)) **High**
- We could not confirm whether browser speech can be routed through Web Audio. We believe it cannot in most browsers. **Low (verify)**

**Decision**
- **Duck** the sonification bus to about 30% on speech start and restore it on end (and on error), always with ramps.
- Recorded Bangla narration clips play through Web Audio, so they can be ducked and mixed precisely.

```ts
function speak(text: string, lang: string, sonificationBus: GainNode, ctx: AudioContext) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  const restore = () => glideTo(ctx, sonificationBus.gain, 1.0, 0.15);
  u.onstart = () => glideTo(ctx, sonificationBus.gain, 0.3, 0.1);
  u.onend = restore;
  u.onerror = restore;
  speechSynthesis.speak(u);
}
```

### A7. Phones

**Findings**
- Operating-system audio buffering varies by device, from a few milliseconds up to around 50 ms. ([web.dev: A tale of two clocks](https://web.dev/articles/audio-scheduling)) **High**
- A W3C **Web Audio API 1.1** working draft (22 Sep 2026) adds playback statistics, including underruns and latency. ([W3C](https://www.w3.org/TR/webaudio-1.1/)) Browser support is **unknown**; too new to rely on.

**Decision**
- Test on a real mid-range Android before recording the video.
- Keep node counts low (shared filters, one context).
- Do not rely on the new statistics API.

### A8. Recommended audio graph

```
                ┌─ Ocean voice  (osc → gain → panner) ─┐
                ├─ Rain voice   (drops → bandpass → gain → panner) ─┤
 per-track ───► ├─ Snow voice   (bells → gain → panner) ─┤──► Sonification bus (duckable)
 voices         ├─ Other tracks (one voice per active track) ─┘            │
                                                                           ▼
 Earcons, legend tones ───────────────────────────────────────────► Master gain (0.8)
 Recorded narration (Bangla/English) ─────────────────────────────►      │
                                                                         ▼
                                                           Compressor (safety net)
                                                                         │
                                                                    destination
```

---

## 5. Part B: Sonification design (what people can actually hear)

### B1. Direction of mapping ("polarity")

**Findings**
- Walker (2002) showed that which direction listeners expect (for example, higher pitch = more) **depends on the kind of data**; he proposed magnitude estimation as a design tool, with agreement on polarity predicting how well a mapping works. ([PubMed](https://pubmed.ncbi.nlm.nih.gov/12570096/), *J Exp Psychol Appl* 8(4), 2002) **High**
- The Sonification Handbook's "Theory of Sonification" chapter gives the example that listeners may agree **pitch should rise with temperature** (positive polarity) but fall with increasing size (negative polarity). ([Handbook downloads](https://sonification.de/handbook/downloads/)) **High**
- Walker and colleagues also compared mappings for **visually impaired and sighted** listeners. ([ACM TACCESS, doi:10.1145/1714458.1714459](https://dx.doi.org/10.1145/1714458.1714459)) We have not yet read the detailed results. **To read**

**Decision**
- Keep **temperature → higher pitch** (ocean, land temperature, heat then vs now).
- For every other category, **do not assume** direction. Check the literature and include it in the October pilot.

### B2. Can people hear our pitch steps?

**Findings**
- In lab conditions, adults can detect frequency changes of about **0.2–0.3%** for tones between 250 and 4000 Hz. ([ScienceDirect Topics: Frequency discrimination](https://www.sciencedirect.com/topics/immunology-and-microbiology/frequency-discrimination), citing Moore 1973) **High**

**Our numbers (our calculations)**
- Ocean voice: 40 °C spans two octaves (220 → 880 Hz), so **1 °C ≈ 0.6 semitones ≈ 3.5% frequency change**. That is well above the lab threshold.
- Heat then vs now: 5 °C spans two octaves, so **+1.37 °C ≈ 6.6 semitones** (≈ 368 → 539 Hz).

**Caution:** detecting a difference between two tones played back to back is **not** the same as judging "how many degrees" from one tone, or remembering a pitch while exploring. Lab thresholds are a best case.

**Decision**
- Keep the current scales for Video 1.
- **Fix the legend problem:** the same pitch means very different temperatures in the ocean voice and the heat voice. Either use different timbres for the two voices, or show and play the scale every time the mode switches.
- Test with T4 (Section 7).

### B3. Loudness changes with pitch

**Findings**
- Pure tones at different frequencies are **not perceived as equally loud** at the same sound pressure; the standard for this is ISO 226:2023 (equal-loudness-level contours). ([ISO](https://www.iso.org/standard/83117.html)) **High**

**What this means for us (our reasoning)**
- As the ocean voice glides from 220 Hz to 880 Hz, its perceived loudness will change even if gain stays fixed. A listener might hear "louder" and think it means something.
- The **GRACE bass voice (80–320 Hz)** is most at risk: low tones need more energy to sound equally loud, and small phone speakers may barely reproduce them. (Phone speaker behaviour is our assumption; test T5.)

**Decision**
- Add a simple **loudness compensation** per voice (a gain curve by frequency), tuned by ear in T3.
- For the bass voice, add a few **harmonics** so the pitch is still heard on phone speakers even if the lowest frequency is lost. (Design choice, test T5.)

### B4. How many sounds at once?

**Findings**
- A study on multi-stream sonification reported that listeners could identify **trends in five concurrent variables** in one sonification, when the design encouraged hearing them as separate streams. ([ResearchGate: Measuring comprehension in sonification tasks that have multiple data streams](https://www.researchgate.net/publication/262252005_Measuring_comprehension_in_sonification_tasks_that_have_multiple_data_streams)) **High for that design; not a general limit**
- Auditory research shows that **frequency separation** helps people hear sounds as separate streams. (e.g. [PMC: The role of auditory cortex in the formation of auditory streams](https://pmc.ncbi.nlm.nih.gov/articles/PMC2040076/)) **High (general principle)**

**Decision**
- Give each voice its own **register, timbre and rhythm** so they separate naturally (for example, ocean mid tone, rain noise bursts, water bass).
- Default limit: **3 tracks playing at once** (design choice). The five-variable result shows more is possible, but only with careful design we have not done yet.
- Test with T7.

### B5. Sound families for all 23 EIC daily categories (design choices, all untested)

Grouping categories into **families** helps listeners learn once and recognise many.

| Family | Categories (SVS ID) | Proposed sound | Status badge today |
|---|---|---|---|
| **Temperature** (pitch) | SST 5101, land temperature 5147 | Warm sine, pitch = value | 5101 Verified · 5147 Not yet converted |
| **Deviation** (consonance → dissonance) | SST anomaly 5176, rain variation 4897 | Pure → detuned chord ("unusual", not "bad") | Not yet converted |
| **Water falling** (density) | IMERG rain 4285, GEOS precipitation + clouds 5149 | Drops; density = rate; bells for snow | 4285 Verified |
| **Air** (noise texture) | Wind 5148, humidity 5150 | Wind: filtered whoosh, speed = brightness · Humidity: more echo = wetter | Not yet converted |
| **Air quality** (roughness) | PM2.5 5151, ozone 5152, CO 5153, NOx 5154 | Hazy, rough texture; roughness = concentration | Not yet converted (model estimates) |
| **Fire** (percussion) | VIIRS fires 5113, fire weather forecast 5315 | Crackle per fire · one tone per risk level | Not yet converted |
| **Risk levels** (discrete tones) | Landslide exposure 5584 | Fixed tone per level; calm, not alarming | Not yet converted |
| **Ice** (glassy shimmer) | Sea ice 5046, 5064, 5099 | Shimmer where ice is present | Not yet converted |
| **Life** (slow pad) | NDVI 5544 | Slow pad (stale data: always show date) | Stale (104 days in our test) |
| **Picture only** | GOES true colour 5120, hurricane plots 5072, satellite fleet 5067, SDO Sun 5577 | Brightness or chart line only; fleet = satellite chimes | Picture only |

**Rules for every family**
- Personal style or instrument choices may change **timbre only**, never the value → pitch/density rule (already in the build plan).
- GEOS products are **model estimates**; label them that way on screen.
- Direction (B1) must be checked for every non-temperature family before it is presented as intuitive.

### B6. Open questions for the October pilot

1. Can listeners judge **magnitude** (not just difference) from one ocean tone after the legend?
2. Is 2 → 40 drops/s heard as a smooth scale, or do high rates blur into one texture?
3. Is detuning heard as "unusual" rather than "broken" or "bad"?
4. Do variability → timbre and seasonality → rhythm come across at all? (Build plan already marks these as design choices.)
5. Do BLV and sighted listeners prefer the same directions for our non-temperature families?

---

## 6. Part C: Accessibility audio

### C1. Learn from existing accessible tools

| Tool / paper | Why it matters to us | What to extract |
|---|---|---|
| **iSonic**: Zhao, Plaisant, Shneiderman, Lazar (2008), "Data Sonification for Users with Visual Impairment: A Case Study with Georeferenced Data", *ACM TOCHI* 15(1). [doi:10.1145/1352782.1352786](https://doi.org/10.1145/1352782.1352786) | Closest to us: sonified **maps** for visually impaired users | Keyboard navigation of a map, overview then detail |
| **Umwelt** (Zong et al., CHI 2024). [Project page](https://vis.csail.mit.edu/pubs/umwelt/) | Co-designed with a blind researcher; combines sonification with structured text | Their study found sonification gives an **overview** while text gives **detail**; pair our sounds with spoken values |
| **MAIDR** (Seo et al., CHI 2024). [ACM](https://dl.acm.org/doi/10.1145/3613904.3642730) · [GitHub](https://github.com/xability/maidr) | Web library; supports **heat maps**, tested with 11 blind participants | Keyboard patterns for moving across a grid; review mode |
| **NASA data sonifications**. [nasa.gov](https://www.nasa.gov/data-sonifications/) | NASA's own sonifications were made with scientists, musicians and a member of the BLV community | Involve BLV people in design, not only testing |
| "A Universe of Sound" (*Frontiers in Communication*, 2024). [Link](https://www.frontiersin.org/journals/communication/articles/10.3389/fcomm.2024.1288896/full) | Studied participant responses to NASA sonifications, with and without sight loss | Common misunderstandings of what sonification represents |

### C2. Honest silence vs a "no data" cue

**Problem (our reasoning):** for a blind user, silence over land could sound like the app froze.

**Decision (design choice, test in pilot)**
- Keep silence as the meaning of "no data", but play a **very soft, short tick** when the cursor **enters** a no-data area, and speak "no ocean data here" on Enter.
- Caption: "Silence = no data at this point."

### C3. Audio legend and warm-up

- Play reference sounds before exploring: 0 / 10 / 20 / 30 °C, light / heavy rain, snow (already feature A4).
- **New:** replay the relevant legend when switching mode or track, because scales differ between voices (see B2).
- Include a volume check in the warm-up (A5).

### C4. Speech, captions and language

- Ducking during speech (A6).
- Every sound event has a caption (build plan 9.4).
- Bangla uses **recorded clips**. Whether Android devices have a usable Bangla speech voice is **unverified**; keep recorded clips as the default.

### C5. Comfort and safety

- No sudden loud sounds; volume capped (A5).
- **Esc stops everything instantly**, with a fast fade (about 50 ms) rather than a hard cut.
- A "calm mode" that turns off extreme pings and dissonance for sensitive listeners (design choice, October).

---

## 7. Ear tests (run before the freeze)

These are **engineering checks by teammates**, not scientific evidence. Results decide settings; they are **never** quoted in the video as findings about users. Write the pass rule **before** running each test, as we did for tests A–P5.

| ID | Test | Setup | Pass rule (write before running) | Decides |
|---|---|---|---|---|
| **T1** | Click test | Ocean tone; jump between values instantly vs 30 ms glide | 3/3 teammates hear no click with glide, on laptop and phone | A1 glide time |
| **T2** | Speech ducking | Speak 10 random values over ocean + rain, with and without ducking | 10/10 values understood with ducking | A6 duck level |
| **T3** | Loudness balance | Ocean tone at 220, 440, 880 Hz, same gain; headphones and phone | Adjust gain curve until teammates rate them equally loud | B3 compensation curve |
| **T4** | Pitch step | Pairs of ocean tones 1 °C apart, random order | ≥ 8/10 correct "higher/lower" per teammate | B2 scale |
| **T5** | Phone bass | GRACE bass 80–320 Hz on a phone speaker, with and without harmonics | Pitch movement audible on phone with harmonics | B3 bass design |
| **T6** | Rain rate + phone load | Play 2, 5, 10, 20, 40 drops/s; watch for stutter on a mid-range Android | No stutter at 40/s; teammates rank the 5 rates correctly | A2 look-ahead, A4, B6 Q2 |
| **T7** | How many voices | Play 1, 2, 3, 4 tracks together; ask "which are playing?" | ≥ 8/10 correct at the chosen default | B4 limit |

Record every result in the log (Section 9), including failures.

---

## 8. Schedule

| When | L2 audio research work |
|---|---|
| **Sun 27** | Implement A1–A5 patterns in `lib/audio.ts`. Run **T1, T2**. |
| **Mon 28** | Run **T3, T4, T5, T6**. Update `mapping.json` values. Build legend replays (C3). |
| **Tue 29 (AM)** | Run **T7**. Mix polish. **Freeze 12:00.** |
| **Tue 29 (PM) to Wed 30** | Support recording; no new audio features. |
| **Oct week 1** | Read Handbook chapters: *Theory of Sonification* (Walker & Nees), *Perception, Cognition and Action in Auditory Displays* (Neuhoff), *Evaluation of Auditory Display* (Bonebright & Flowers), *Sonification Design and Aesthetics* (Barrass & Vickers). Read iSonic and the TACCESS BLV mapping paper. |
| **Oct week 2** | Design sound families for new tracks (B5); decide polarity per family (B1). |
| **Oct week 3** | Draft pilot questions (B6) with the mentor; consent planning for BLV participants. |
| **Oct week 4** | Pilot; update mappings from results. |

---

## 9. Findings log template

Copy this table into `docs/audio_findings.md` and add one row per finding or test.

| Date | Question | What we found | Source or test ID | Confidence (High / Medium / Low) | Decision for our app | Owner |
|---|---|---|---|---|---|---|
| 27 Sep | Example: does a 30 ms glide remove clicks? | No clicks heard on laptop; one click on phone | T1 | Medium | Raise glide to 40 ms on mobile | L2 |

---

## 10. What L2 hands to the other lanes

**To L1 (Data) and the shared data contract**
1. `mapping.json` needs **structured numbers**, not just text, so `audio.ts` and the Mapping panel use the same source:
   ```ts
   export interface VoiceScale {
     domainMin: number; domainMax: number;
     domainScale: "linear" | "log";
     outMin: number; outMax: number;       // Hz, drops/s, gain...
     outScale: "linear" | "exponential";
     unit: string;                          // "°C", "mm/h"
   }
   // add `scale: VoiceScale` to VoiceRule; generate the panel's rule text from it
   ```
2. A **generic track type** (track ID, value, unit, status badge) instead of only `"sst" | "rain"`, so new categories don't require rewriting the contract.
3. Year-by-year **series** in the then-vs-now demo data (not only window means), so the heat, monsoon and water voices can actually play the years.
4. Clarify **rain no-data vs dry** (`phase` when `mmPerHour` is `null`).

**To L3 (Interface / Accessibility)**
- Start button first in focus order (A3); legend replay on mode switch (C3); "no data" tick and caption (C2); Esc = instant fade-out (C5).

**To L4 (Story / Video)**
- Only claim what Section 11 allows. Ear test results are settings, not findings about users.

---

## 11. Research honesty rules

1. **No invented sources.** Every source here was found and checked. If you add one, add its link.
2. **Label confidence** on every finding (High / Medium / Low).
3. **Label design choices** as design choices. They become findings only after testing.
4. **Teammate ear tests are not user evidence.** Never present them as "listeners found...".
5. **Lab results are best cases.** Real listening (memory, distraction, phone speakers) is harder.
6. If a finding changes a number on screen, check it against Section 16 of the build plan first.

---

## 12. Sources and things still to verify

### Verified sources (all opened or found during this research)

**Web Audio engineering**
- MDN, AudioParam: https://developer.mozilla.org/en-US/docs/Web/API/AudioParam
- MDN, AudioBufferSourceNode: https://developer.mozilla.org/docs/Web/API/AudioBufferSourceNode
- MDN, AudioContext: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
- MDN, SpeechSynthesisUtterance: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance
- Chris Wilson (2013), "A tale of two clocks", web.dev: https://web.dev/articles/audio-scheduling
- Chrome for Developers, "Autoplay policy in Chrome": https://developer.chrome.com/blog/autoplay
- W3C, Web Audio API 1.1 (Working Draft, 22 Sep 2026): https://www.w3.org/TR/webaudio-1.1/

**Sonification and perception**
- Hermann, Hunt, Neuhoff (eds.) (2011), *The Sonification Handbook*, Logos Verlag Berlin. Free PDF and chapters: https://sonification.de/handbook/
- Walker, B. N. (2002), "Magnitude estimation of conceptual data dimensions for use in sonification", *J Exp Psychol Appl* 8(4):211–221: https://pubmed.ncbi.nlm.nih.gov/12570096/
- "Universal Design of Auditory Graphs: A Comparison of Sonification Mappings for Visually Impaired and Sighted Listeners", *ACM TACCESS* 2(3): https://dx.doi.org/10.1145/1714458.1714459
- "Measuring comprehension in sonification tasks that have multiple data streams": https://www.researchgate.net/publication/262252005
- ISO 226:2023, Acoustics: Normal equal-loudness-level contours: https://www.iso.org/standard/83117.html
- Frequency discrimination overview (ScienceDirect Topics): https://www.sciencedirect.com/topics/immunology-and-microbiology/frequency-discrimination

**Accessibility**
- Zhao, Plaisant, Shneiderman, Lazar (2008), iSonic, *ACM TOCHI* 15(1): https://doi.org/10.1145/1352782.1352786
- Zong et al. (2024), Umwelt, CHI '24: https://vis.csail.mit.edu/pubs/umwelt/
- Seo et al. (2024), MAIDR, CHI '24: https://dl.acm.org/doi/10.1145/3613904.3642730 · https://github.com/xability/maidr
- NASA, Data Sonifications: https://www.nasa.gov/data-sonifications/
- "A Universe of Sound" (2024), *Frontiers in Communication*: https://www.frontiersin.org/journals/communication/articles/10.3389/fcomm.2024.1288896/full

**Earth science sonification context**
- NASA Earthdata blog, "From Data to Melody": https://www.earthdata.nasa.gov/news/blog/from-data-melody-data-sonification-its-role-open-science
- *Nature Reviews Earth & Environment* (2024), "Improving Earth science communication and accessibility with data sonification": https://www.nature.com/articles/s43017-023-00512-y
- *Frontiers in Psychology* (2022), climate sonification and visualization in 32 projects: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.1020102/full
- UNOOSA (2023), "Sonification: A Tool for Research, Outreach and Inclusion in Space Sciences": https://www.unoosa.org/documents/pdf/Space4PersonswithDisabilites/UNOOSA_Special_Report_on_Sonification_2023.pdf

### Still to verify (do not rely on these yet)

| Item | Why it matters | How to check |
|---|---|---|
| Can browser speech be routed through Web Audio? | Affects how ducking works | Try in Chrome and Edge; check the Web Speech spec |
| Does `DynamicsCompressorNode` ever let peaks through? | Volume safety | Push test signals over 1.0 and inspect output with an AnalyserNode |
| Bangla speech voice on Android | Live Bangla values | Check `speechSynthesis.getVoices()` on teammates' phones |
| Phone speaker low-frequency limit | GRACE bass audibility | Test T5 |
| Detailed results of the BLV vs sighted mapping paper | Polarity for BLV users | Read the TACCESS paper in October |
| `cancelAndHoldAtTime` support in Firefox | Smoother glide code | Check MDN compatibility table (we avoided it for now) |
