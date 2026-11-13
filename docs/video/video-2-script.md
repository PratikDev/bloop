# Bloop · Video 2 script ("240 Seconds of Glory")

**Team PTSD · NASA Space Apps Challenge 2026 · Challenge #14, The Earth Information Jukebox**

| | |
|---|---|
| Runtime | **3:51** planned. **Hard cap: 3:55.** Check the exported file, not the timeline. |
| Deadline | 13 Nov, 6:00 PM Dhaka time. Upload by **5:30 PM** at the latest. |
| Deliver to | YouTube (link in the Google Form), the video file in the Local Lead's Drive folder, and nasaspaceappsbd.com |
| Live app | https://bloop-ptsd.pages.dev · Code: https://github.com/PratikDev/bloop |
| Style frames | [animation-style.png](animation-style.png) (the story) · [blind-low-vision-style.png](blind-low-vision-style.png) (how we show blind and low-vision people) |

---

## The built film

The film is built: [bloop-video-2.mp4](bloop-video-2.mp4), 3:52, with subtitles burned in and no voiceover yet. Record the voiceover from [video-2-vo-cues.md](video-2-vo-cues.md): it has the final wording and the exact start and end time of every line. Subtitles for YouTube: [video-2-subtitles.srt](video-2-subtitles.srt).

Where the film differs from the plan below, the film and the cue sheet are right:

- **No on-camera scenes.** The team is introduced on the app's own Team page, with photos and roles, and the NASA dataset roll call is an animated scene read in voiceover.
- **Timings shifted** by a few seconds per scene (total 3:52, under the 3:55 cap).
- **The screen reader's words are shown as text** under the app window ("To the screen reader: …"), taken live from what the app sends to assistive technology. NVDA's voice is not in the film.
- **Not shown:** the 3D scenes and the turntable search.

---

## Who this is for

**Blind and low-vision people are the main stakeholders.** Every feature in Bloop starts from one question: how does someone who can't use the picture get the same information, and trust it? The video is built the same way. The story is theirs, the demo follows their way of using the app, and the ending hands the next step to them.

> **In Bangladesh, we have always known our weather by ear.**

Rain on a tin roof. Wind before a cyclone. Blind people here already read the weather by sound. NASA's Earth Information Center shows our planet in pictures, which leaves them out, along with everyone whose sight makes those pictures hard to read. Bloop gives them the same frames as sound, speech, braille and a view they can actually read, and shows them how much to trust it. We end on the Bloop itself, a sound from the ocean that turned out to be ice breaking off Antarctica.

The feeling we want: **quiet, not sad.** No pity, no doom, no swelling music.

### Two people, not one

Blind and low-vision are different needs, and the video shows both.

| | **The Listener** | **The Reader** |
|---|---|---|
| Who | Blind | Low vision |
| Drawn as | The coral line, with a white cane (navy shaft, coral tip, as real canes have a red tip) | The same coral line, with round glasses drawn as two small open circles. Always leans in close to what they're reading. |
| How they use Bloop | Sound, the screen reader, braille | Low-vision mode: high contrast, large text, the lens, re-coloured maps |
| Their moment | Scene 8 (screen reader) and scene 9 (braille) | Scene 10 (low-vision mode) |
| How we show what they experience | We don't show what they "see". We give them sound, and the frame goes quiet when the picture gives them nothing. | We show their view: the picture goes soft, with only a small sharp patch where they're looking. Then Bloop's lens makes the value big and clear. |

### How we show them (rules for the whole team)

1. **Experts, not patients.** The Listener knows the monsoon better than anyone in the gallery. The Reader reads the picture closer and more carefully than the crowd does. What fails them is the picture, not their eyes.
2. **No disability simulation.** No blindfolds, no "close your eyes and try it" demo by a sighted teammate. The cold open asks the *viewer* to close their eyes for one line. That's an invitation to listen, not a simulation.
3. **Real tools, shown properly.** White cane, screen reader (NVDA), braille, Windows Magnifier, large text. Show them working at the speed their users actually use them.
4. **Never "inspiring", never "suffering".** No slow-motion, no sad piano, no "despite their disability". They are users of a product.
5. **Honest about what's proven.** We haven't tested Bloop with blind or low-vision users yet. The video says so and makes it the next step (scene 15). It never says "validated", "loved by" or "tested with blind users".
6. **The video itself must work without sight.** Every number on screen is also spoken. The voice-over says what matters in each picture. Subtitles are large and high-contrast. A blind judge listening to this video should get the whole story.

### Credibility, braided through

A sonification is easy to fake: any team can play pretty tones over a map. Blind and low-vision users can't check our sound against the picture, so **trust matters more for them than for anyone.** That's why we show the proof instead of claiming it:

1. **Every number wears its source** on screen (see "Receipts" below).
2. **P tells you where a value came from** (scene 8).
3. **We measured how wrong we are** against NASA's own source data, and say the numbers out loud (scene 13).
4. **U plays our tone and NASA's file tone together**, so you can hear whether they agree (scene 13).
5. **We threw out a NASA dataset** because it disagreed with independent records (scene 13).
6. **The music can't bend the data:** the app checks itself on camera (scene 13).
7. **We only say what is statistically clear** (scene 14 shows the range).
8. **We say exactly what's tested and what isn't** (braille in scene 9, users in scene 15).

Generic videos say "accurate", "real-time", "accessible", "powered by NASA data". We never use those words. We show the thing instead.

---

## The five things the judges must get (and where they are)

| Requirement | Where | How |
|---|---|---|
| 1. Team name | 0:14, and the end card at 3:46 | Spoken and on screen |
| 2. Every member by name | 0:14–0:25 | Each name spoken, on the app's own Team page |
| 3. Problem and challenge statement | 0:35–1:11 | The problem through the Listener and the Reader, then the official statement on screen, its key lines read aloud |
| 4. Live demo (screen recording) | 1:32–3:24 | The real app, recorded live with system audio and the real screen reader. No slides, no mock-ups |
| 5. NASA datasets named out loud | 2:20–2:31 on camera, also 0:35 and 3:04 | Dipika names every dataset to camera; the Earth Information Center, GISTEMP and GRACE are named again where they play |

---

## Look and feel

### The line

- **Drawn from the sound.** The Listener and the Reader are made of the same coral line as the waveform in the cold open. The line lifts off the waveform and becomes a person; at the end it melts back.
- **One stroke, no fill.** Coral (`#ff6b4a`), 6 px at 1080p, round caps. The head is an open circle with a small gap where the stroke enters. No face until the last scene. Feeling comes from posture: head tilt, shoulders, how still they are.
- **Hand-made motion.** Animate on twos (12 drawings a second) with a gentle line boil: three slightly different drawings of each held pose, cycled. This one detail keeps it from looking like a template.
- **Everyone else is navy** (`#14213d`): the team, the gallery crowd. Coral belongs to the Listener, the Reader, and sound.
- **In the demo,** the character whose scene it is sits on the bottom edge of the app window, reacting to what plays. They never cover the interface.

### Colour, type and frame

| Role | Value |
|---|---|
| Paper (drawn scenes, the demo frame) | `#fff8e6` |
| Night (cold open, the close) | `#14213d` |
| Ink (environments, other figures, text) | `#14213d` on paper, `#fff8e6` on night |
| The Listener, the Reader, and anything that is sound | `#ff6b4a`, the only accent in any frame |
| Rain, used sparingly | `#7db8f0` |
| Type | **Archivo** (the app's font) for every word on screen; **Anek Bangla** for Bangla. Sentence case. No hand lettering. |

- **Receipts:** every number on screen carries a small source tag under it, in Archivo at 60% size: the dataset and the years, e.g. *NASA GISTEMP · 1981–1990 vs 2016–2025*. Same position, same size, every time.
- **Keycaps:** every key pressed in the demo appears as a drawn navy keycap in the left margin, with a two-word label (e.g. **J** *jump region*). They're how the keyboard-first design reads on screen.
- **Demo frame:** the screen recording sits at 90% scale, centred on paper. This keeps the UI readable, gives the characters somewhere to sit, and leaves a clean bottom margin for subtitles.
- **Camera:** locked off. The only move is a slow push-in, never more than 5% over a shot.
- **Transitions:** the coral line does them. It draws across, or a character's hand match-cuts onto the app's needle. No preset wipes.

### Sound

- **No music track. The app's sound is the soundtrack.** Every tone, drop and chord is recorded from Bloop. Where a scene needs a bed, use Bloop's own *Water's journey* (Listen › More) with the Science to Art dial at Music, about 18 dB under the voice.
- **The screen reader is a voice in this film.** In scenes 8 and 9, NVDA's speech is part of the mix, at the rate a regular user would set it, not slowed down for sighted viewers. Subtitle it.
- **Voice-over:** a team member's own voice, recorded close in a quiet room. Not text-to-speech. Speak slowly; the timings assume about 135 words a minute.
- **Silence is a tool.** In scene 4, everything cuts to silence for a beat and a half. Don't fill it.
- Mix in stereo and check on headphones: in Bloop, west is the left ear and east is the right.

### What we never do

- Stock footage, stock music, whooshes, risers, "ding" sounds.
- AI-generated images, video or voice.
- Glowing particle globes, lens flares, HUD overlays, glitch transitions, neon gradients.
- Words flying in one at a time, bouncing text, typewriter reveals.
- Emoji, clip-art icons, a logo we invented. Use the real Bloop wordmark from `docs/readme/banner.svg`.
- Blindfolds, "a day in the dark" simulations, sad close-ups, or the word "suffer".
- A presenter reading the whole thing to camera. Faces appear briefly, where they matter.

---

## The script

Each scene: what we see, what we hear, the voice-over (**VO**), and the words on screen. Timecodes are cumulative.

| # | Scene | Time | Length |
|---|---|---|---|
| 1 | Cold open | 0:00–0:14 | 14 s |
| 2 | Who we are | 0:14–0:25 | 11 s |
| 3 | By ear | 0:25–0:35 | 10 s |
| 4 | The picture | 0:35–0:57 | 22 s |
| 5 | The challenge | 0:57–1:11 | 14 s |
| 6 | The turn | 1:11–1:19 | 8 s |
| 7 | How Bloop works | 1:19–1:32 | 13 s |
| 8 | Demo: with a screen reader | 1:32–1:54 | 22 s |
| 9 | Demo: braille | 1:54–2:04 | 10 s |
| 10 | Demo: low vision | 2:04–2:20 | 16 s |
| 11 | Our NASA data | 2:20–2:31 | 11 s |
| 12 | Demo: the whole rack | 2:31–2:45 | 14 s |
| 13 | Demo: why you can trust it | 2:45–3:04 | 19 s |
| 14 | Then vs Now | 3:04–3:24 | 20 s |
| 15 | What's next | 3:24–3:32 | 8 s |
| 16 | The Bloop | 3:32–3:46 | 14 s |
| 17 | End card | 3:46–3:51 | 5 s |

### 1 · Cold open · 0:00–0:14

**Picture:** Night. A single flat coral line across the frame. At 0:02 it starts to move with the sound: Bloop's live ocean hum and rain drops over the Bay of Bengal.
**Sound:** record A3 (Ocean and rain together, key **3**), needle on the Bay of Bengal, recorded straight from the app.
**On screen (0:00–0:03, small, bottom):** Best with headphones.

> **VO:** Close your eyes.
> *(beat)*
> This isn't music. It's the Bay of Bengal today, its water and its rain, measured by NASA and played live by our code.

**Receipt (as "today" is said):** Bay of Bengal · NASA EIC frame (SVS 5101) · [date of the frame, exactly as the app shows it]

### 2 · Who we are · 0:14–0:25

**Picture:** The app's own **Team** page (Header › Team), screen-recorded. As each name is spoken, the coral line traces around that person's photo. Then the photos fade, leaving five navy stick figures, each with one prop: Dipika a satellite dish, Samonwita a laptop, Pratik headphones, Arnob a pencil, Rashed a magnifying glass.
**On screen:** Team PTSD, then each name with its role as it's spoken.

> **VO:** We're Team PTSD, from Chattogram, Bangladesh.
> Dipika Nath. Samonwita Sarker. Pratik Dev. Arnob Mozumder. Rashed UL Islam.

| Name | Role (on screen) |
|---|---|
| Dipika Nath | Research and data lead |
| Samonwita Sarker | Frontend developer |
| Pratik Dev | Audio engineer |
| Arnob Mozumder | Video editing and animation |
| Rashed UL Islam | Researcher |

### 3 · By ear · 0:25–0:35

**Picture:** Paper. A tin roof drawn in navy zigzag lines. The Listener sits on the doorstep underneath, cane resting against the wall, head tilted up toward the sound. Rain falls everywhere except under the roof; where a drop hits the tin, a small coral tick. At "wind," the rain slants.
**Sound:** Bloop's rain voice (record A2, key **2**), heavy rain near the coast.

> **VO:** In Bangladesh, you hear the monsoon before you see it: rain on a tin roof, wind before a cyclone. We know our weather by ear.

### 4 · The picture · 0:35–0:57

**Picture:** A gallery wall. A big frame holds the real SVS 5101 sea surface temperature frame. A crowd of navy stick figures admires it from a few steps back.
- **The Listener** stands at the back with the cane, head turned toward the frame, listening. Nothing comes back.
- **The Reader** is right up at the frame, glasses almost touching it. Cut to their view: the whole picture goes soft. Only a small patch where they're looking stays sharp, too small to make sense of the map.

**Sound:** The rain carries over, then **cuts to total silence on "that you can see it."** Hold it for a beat and a half.

> **VO:** NASA's Earth Information Center turns satellite data into pictures: today's ocean, the last half hour of rain.
> But a picture asks one thing of you first: that you can see it.
> *(silence)*
> Forty-three million people are blind. Nearly three hundred million more live with serious sight loss.

**On screen:** 43 million people are blind. 295 million more have moderate or severe sight loss.
**Receipt:** Vision Loss Expert Group / GBD 2019 · *The Lancet Global Health*, 2021 · figures for 2020

### 5 · The challenge · 0:57–1:11

**Picture:** A paper card with the official challenge statement typeset in full, in Archivo. As each phrase is read, the coral line underlines it; on "translate sight into sound", it circles the words. The Listener and the Reader sit on the corner of the card.
**Header on the card:** NASA Space Apps Challenge 2026 · #14 The Earth Information Jukebox
**On screen (verbatim):**

> NASA's Earth Information Center (EIC) produces stunning visualizations of our changing planet, but presenting Earth science through visualization alone limits who can reach it. We invite you to make this complex Earth science accessible, engaging, and multi-sensory by translating sight into sound. Your challenge is to build an "Earth Jukebox"—an interface, script, or application that pairs Earth Information Center (EIC) visual frames with dynamic sonifications generated in real time.

> **VO:** That's the problem behind Challenge fourteen: Earth science shown through visualization alone limits who can reach it. The challenge: translate sight into sound, in real time, from the Earth Information Center's own frames.

### 6 · The turn · 1:11–1:19

**Picture:** Back in the gallery. The Listener steps forward and reaches toward the frame. A coral line runs from their hand into the image and becomes a needle on the Bay of Bengal. Sound returns: one clear ocean note. Beside them, the Reader's soft view snaps sharp around the needle.

> **VO:** So we built Bloop for the people those pictures leave out. Not a soundtrack for a picture: the picture, as sound.

### 7 · How Bloop works · 1:19–1:32

**Picture:** Split frame. Left: the real SVS 5101 frame, zooming into the Bay of Bengal. Right: the Listener picks up one pixel (a small square in its real colour), carries it along the frame's own colour bar to 29.8 °C, and drops it into a jukebox slot. It sounds. Then three quick vignettes, each with its real sound: the Listener stretches up as the pitch rises; rain dashes multiply; the Listener turns their head left, then right, as the sound pans.
**On screen (one step at a time):** 21.5° N, 89.8° E → 29.8 °C → 735 Hz

> **VO:** Bloop reads each pixel of NASA's frame back into its number, using the frame's own colour bar. Warmer water, higher note. More rain, more drops. West left, east right.

### 8 · Demo: with a screen reader · 1:32–1:54

**Picture:** Screen recording, the app at 90% on paper, **NVDA running**, no mouse anywhere. Home → **Start listening** (skip the intro). Tab to the map. Then, with keycaps in the margin for each:
1. **L** *legend*: the reference tones.
2. **Arrows**, then **Shift+arrow** *10°*, over the Bay of Bengal. NVDA speaks each step once. The dock's West-to-east and South-to-north sliders move with the needle.
3. **+** / **−** *step size*.
4. **J** then **5** *jump region*.
5. **Enter** *value*: the value and the place.
6. **P** *source*: the provenance line (dataset, agency, the frame's time).
7. **2** *rain*, then **1** *ocean*.
8. North onto land: *No ocean data here*.
9. **Esc** *stop all*: everything goes quiet, which carries us into scene 9.

The Listener sits on the window edge in headphones, cane across their knees, head tilting with the pitch.
**Sound:** the app and NVDA, at a normal user's speech rate. Subtitle NVDA in brackets.

> **VO:** This is Bloop with a screen reader, and no mouse. Arrow keys move the needle, and each step is spoken once.
> *(NVDA speaks, about 3 s)*
> Enter gives the value and the place. P says exactly where it came from. And over land, it tells you there's no data. It never guesses.

### 9 · Demo: braille · 1:54–2:04

**Picture:** Press **B**: the braille data explorer opens, and NVDA's Braille Viewer shows the same reading as braille cells. Move the needle: the caret moves along the braille shape line. Press **R** *review*: the value in words. Switch to বাংলা (Header › বাংলা): the whole interface turns Bangla and the value line becomes Bengali braille. The Listener's fingers rest on a drawn braille line in the margin.
**Receipt (small):** Tested in NVDA's Braille Viewer (English UEB and Bengali grade 1). Refreshable braille displays: not tested yet.

> **VO:** Press B, and the same reading becomes braille, in English or Bangla, with the needle as the cursor.

### 10 · Demo: low vision · 2:04–2:20

**Picture:** Screen recording. Press **Alt+L**: the low-vision preset. High-contrast bands with their ranges written on them, thick coastlines, large city names. Press **Z**: the **Context Lens** follows the needle, its value in very large type; **]** makes it bigger. Open **Low-vision settings**: switch the map to *Two-tone high contrast*, raise the text size, then press *Show NASA's original colours* to bring the picture back in one press. If there's time, Windows Magnifier following the needle. The Reader sits on the window edge, leaning in. Then, slowly, sits back. They don't have to lean in any more.

> **VO:** For low vision: Alt and L. High contrast, larger text, and a lens that follows the needle with the value in very large type. Re-colour the map for your eyes, or get NASA's colours back in one press.

### 11 · Our NASA data · 2:20–2:31

**Picture:** Dipika on camera, medium shot, plain wall, natural light. As she names each dataset, it appears in a list beside her and the coral line underlines it.

> **Dipika (to camera):** Our data is all NASA's: Earth Information Center frames from the Scientific Visualization Studio, MUR sea surface temperature, GPM IMERG rain, GISTEMP, and GRACE and GRACE-FO.

**On screen (the list):**
- EIC frames · NASA SVS 5101 (ocean) and 4285 (rain)
- MUR sea surface temperature v4.1 · NASA JPL PO.DAAC
- GPM IMERG half-hourly rain V07 · NASA and JAXA
- GISTEMP v4 · NASA GISS
- GRACE and GRACE-FO mascons · NASA JPL

### 12 · Demo: the whole rack · 2:31–2:45

A fast montage of everything else in the app. **Cut on the notes:** play Bloop's *Water's journey* underneath at full volume between VO phrases, and make every cut land on one of its notes, so the edit is literally timed by NASA data. 13 shots, about a second each. Each gets a two-to-five-word label in the bottom-left margin, in Archivo. Let the C21 fire clicks poke through the mix.

| Shot | What to show | Label |
|---|---|---|
| 1 | Home on a return visit: Continue listening, the 90-second tour, Explore without sound | Start, tour, or no sound |
| 2 | Explore without sound: the map with captions (**C**) instead of sound | Captions instead of sound |
| 3 | Dock › **Records**: the rack, shelves A to D | Every record has a code |
| 4 | The Official records shelf, C1–C23; open one record's Details for half a second (Where it's from, Controls and braille, Credits) | 23 official NASA records |
| 5 | **C21** playing: fire detections as Geiger clicks over tomorrow's fire weather | C21 Fires, as Geiger clicks |
| 6 | **C23** night lights, then **C22** landslides and **C20** NASA's own method, a quarter-second each | C20–C23 |
| 7 | **Turntable**: the Earth turning; **/** search, type *Dhaka*, the needle flies there | Turntable · search |
| 8 | A 3D scene: the Dhaka time tunnel, then Ghost Earths | 3D scenes |
| 9 | The Earth Orchestra legend, then Water's journey playing | Earth Orchestra |
| 10 | **Ask Bloop**, typed in Bangla: *কক্সবাজারে তাপমাত্রা কত*, and the answer | Ask Bloop, in Bangla |
| 11 | Dock › **More** open: Go to a latitude and longitude, Mixer, Previous and next record, Sources and checks | Dock › More |
| 12 | The storm time-lapse stepping with **Page Down**, then **S**, the sweep from Chattogram | 48 half-hours of rain |
| 13 | **H**: the full key list, then Settings (speech mode, verbosity, comfort, instrument style), then the same app on a phone | H: every key |

> **VO:** And there's a whole rack behind it: twenty-three official NASA records, a turntable Earth, 3D scenes, an orchestra of Earth systems, and Ask Bloop, in English or Bangla. Every one plays from the keyboard.

### 13 · Demo: why you can trust it · 2:45–3:04

If you can't see the picture, you can't check the sound against it. So this scene matters most to the people Bloop is for. Three beats, each shown working in the app.

**Beat 1, the measured error.** Screen recording of **How we know**. Push in slowly on the ocean check (0.31 °C against MUR), then the rain check (about 27% against IMERG); Sound rules, Ground vs satellite, Earth Orchestra and Data voice check scroll past underneath. Cut to Listen and press **U** *proof in unison*: the map's tone and NASA's file tone play together, with no beating.
**Receipt:** A new frame that fails its check never plays. The app keeps the last one that passed.

**Beat 2, what we threw out.** How we know › **Credits**, scrolled to "Used in our testing (not playable)" and the line about NASA POWER. The coral line draws a single strike through *POWER*.

**Beat 3, the music can't bend the data.** Settings › the Science to Art dial, turned from Measure to Music, so the sound gets richer. Press **Check the data voice**. Hold on the pass result the app prints. The Listener in the margin gives one small nod. Save the film's only nod for here.

> **VO:** Every value is checked against NASA's source data: a median error of 0.31 degrees for the ocean, about 27 percent for rain. We dropped NASA POWER: it disagreed with independent records. And the music can't bend the data. The app checks every note stays within one cent.

### 14 · Then vs Now · 3:04–3:24

This is the emotional peak. Slow down.

**Picture:** Screen recording of **Then vs Now** (Header, or **T** on the map). Pick **City** › Dhaka and **Part** › Heat (the Part menu shows Heat, Monsoon rain, Water underground, Fires, Vegetation), then **Play this part**. The playhead moves as it plays. Let the 1980s play on their own, then the last ten years. Then Part › Water underground, with **Details** open on the **Full-record trend** row.
**The Listener:** standing in the margin. As the recent decade plays, their line boils harder, like heat shimmer. No sweat drops, no fanning. On the GRACE line, the ground under their feet sinks a few pixels, very slowly.

> **VO:** Dhaka, every April and May, from NASA GISTEMP.
> The 1980s…
> *(the app plays, about 3 s)*
> …the last ten years.
> *(the app plays, about 3 s)*
> One point three seven degrees warmer. And under the ground, GRACE shows Bangladesh's stored water falling since 2002.

**On screen:** Dhaka, April–May: +1.37 °C
**Receipt:** NASA GISTEMP · 1981–1990 vs 2016–2025 · 95% range +0.88 to +1.86 °C
**On screen:** Water stored underground, Bangladesh: falling about 0.32 cm a year
**Receipt:** GRACE / GRACE-FO · 2002–2026 · a clear trend (Mann-Kendall test)

### 15 · What's next · 3:24–3:32

**Picture:** Paper. A table. On one side, the Listener and the Reader, headphones on, a laptop between them. On the other side, the five navy team figures, sitting back, listening, one of them taking notes. The roles are reversed: the team is the audience now.

> **VO:** Next, blind and low-vision listeners here in Chattogram put it to the test. They decide what we build next.

**Before recording, confirm the session is planned** (the YPSA co-design session in `docs/BLOOP_MASTER_BUILD_BOOK.md`, J6). If it isn't, use: *"Next, we test it with blind and low-vision listeners. They decide what we build next."* Never name an organisation on screen until they've agreed.

### 16 · The Bloop · 3:32–3:46

**Picture:** Night. A small iceberg drawn in paper-coloured line. It cracks; the crack becomes the coral waveform. The waveform flattens into a bench, and the Listener and the Reader sit on it in headphones, rain falling. For the first time they have faces: a single small curve each, a smile. Then they unspool back into one flat line.
**Sound:** the live ocean and rain from the cold open, rising gently, then fading to nothing with the line.

> **VO:** In 1997, the ocean made a sound no one could explain: the Bloop. It was ice, breaking off Antarctica. The Earth has always been telling us how it's changing. Now everyone can hear it.

### 17 · End card · 3:46–3:51

**Picture:** Paper. The Bloop wordmark from `docs/readme/banner.svg`.
**Sound:** the **Bloop motif** (Settings › Play the Bloop motif), once. The app's signature closes the film.
**On screen:**

> **Bloop** · Hear Earth's ocean and rain
> Team PTSD · Dipika Nath · Samonwita Sarker · Pratik Dev · Arnob Mozumder · Rashed UL Islam
> bloop-ptsd.pages.dev · github.com/PratikDev/bloop
> NASA data: EIC frames (SVS 5101, 4285) · MUR SST · GPM IMERG · GISTEMP · GRACE / GRACE-FO

The full credits go in the YouTube description, not on screen.

---

## Every feature, and where it is in the film

Checked against `docs/FEATURES.md`, row by row. **Shown** means it's used on screen. **Named** means its name is readable on screen (a menu, the Help list or Settings) but it isn't used.

### Getting started

| Feature | Where |
|---|---|
| Start listening | Shown, scene 8 |
| Explore without sound | Shown, scene 12 (shots 1–2) |
| Continue listening | Named, scene 12 (shot 1) |
| Turn sound on again | Not in the film: it's the browser's one-tap sound unlock, with nothing to show |
| 90-second tour | Named, scene 12 (shot 1) |
| Reset sound choice | Named, scene 12 (shot 13, Settings) |

### Listen

| Feature | Where |
|---|---|
| Live ocean temperature (1) | Shown, scenes 1 and 8 |
| Live rain and snow (2) | Shown, scenes 3 and 8 |
| Ocean and rain together (3) | Shown, scene 1 |
| Move the cursor (arrows, Shift, sliders) | Shown, scene 8 |
| Smaller or larger steps (+ / −) | Shown, scene 8 |
| Jump to a region (J, 1–9) | Shown, scene 8 |
| Speak the value (Enter) | Shown, scene 8 |
| Pause / resume (Space) | Named, scene 12 (shot 13, Help) |
| Sweep from Chattogram (S) | Shown, scene 12 (shot 12) |
| Storm time-lapse frames (Page Up / Down) | Shown, scene 12 (shot 12) |
| Hear the legend (L) | Shown, scene 8 |
| Where this value comes from (P) | Shown, scene 8 |
| Proof in unison (U) | Shown, scene 13 |
| Mute everything (M) | Named, scene 12 (shot 13, Help) |
| Stop everything (Esc) | Shown, end of scene 8 |
| Go to coordinates | Named, scene 12 (shot 11) |
| Mixer | Named, scene 12 (shot 11) |
| Records | Shown, scene 12 (shot 3) |
| Previous / next record | Named, scene 12 (shot 11) |
| Sources and checks | Named, scene 12 (shot 11) |
| Ask Bloop | Shown, scene 12 (shot 10) |
| Water's journey | Shown, scene 12 (shot 9); also the music bed |

### Then vs Now

| Feature | Where |
|---|---|
| Compare decades | Shown, scene 14 |
| Pick the city and part | Shown, scene 14 |
| How it's compared (Details) | Shown, scene 14 |

### How we know

| Feature | Where |
|---|---|
| Ocean check | Shown, scene 13 |
| Rain check | Shown, scene 13 |
| Sound rules | Named, scene 13 (scrolls past) |
| Ground vs satellite | Named, scene 13 (scrolls past) |
| Earth Orchestra | Named, scene 13; shown, scene 12 (shot 9) |
| Data voice check | Shown, scene 13 |
| Credits | Shown, scene 13 |

### Official records

| Feature | Where |
|---|---|
| The shelf (C1–C23) | Shown, scene 12 (shot 4) |
| Play a record | Shown, scene 12 (shot 5) |
| Where it's from | Named, scene 12 (shot 4) |
| Controls and braille | Named, scene 12 (shot 4) |
| Credits (per record) | Named, scene 12 (shot 4) |
| Fires and fire weather (C21) | Shown, scene 12 (shot 5) |
| Landslide exposure (C22) | Shown, scene 12 (shot 6) |
| Night lights by city (C23) | Shown, scene 12 (shot 6) |
| NASA's own sonification method (C20) | Shown, scene 12 (shot 6) |

### Turntable

| Feature | Where |
|---|---|
| Turntable Earth | Shown, scene 12 (shot 7) |
| Value under the needle (Enter / I) | Named, scene 12 (shot 13, Help) |
| Turn the globe | Shown, scene 12 (shot 7) |
| Move the needle (Up / Down) | Named, scene 12 (shot 13, Help) |
| Search places (/ or G) | Shown, scene 12 (shot 7) |
| Where am I? (L) | Named, scene 12 (shot 13, Help) |
| Tour (T) | Named, scene 12 (shot 13, Help) |
| Bookmarks (1–9) | Named, scene 12 (shot 13, Help) |
| Close-up view (V) | Named, scene 12 (shot 13, Help) |
| Layers (O) | Named, scene 12 (shot 13, Help) |
| 3D scenes | Shown, scene 12 (shot 8) |
| Turntable settings | Named, scene 12 (shot 13, Help) |

### Accessibility and settings

| Feature | Where |
|---|---|
| Keys and help (H) | Shown, scene 12 (shot 13) |
| Bangla interface | Shown, scene 9; scene 12 (shot 10) |
| Low-vision mode (Alt+L) | Shown, scene 10 |
| Low-vision settings | Shown, scene 10 |
| Context Lens (Z, [ / ]) | Shown, scene 10 |
| Braille explorer (B, R) | Shown, scene 9 |
| Describe (D) | Named, scene 12 (shot 13, Settings) |
| Captions (C) | Shown, scene 12 (shot 2) |
| Speech mode | Shown, scene 8 (My screen reader); named in Settings |
| Verbosity | Named, scene 12 (shot 13, Settings) |
| Text, sound or both | Named, scene 12 (shot 13, Settings) |
| Braille lines (full / short) | Named, scene 12 (shot 13, Settings) |
| Comfort (reduce motion, comfortable text, sound words, hide 3D) | Named, scene 12 (shot 13, Settings) |
| Instrument style | Named, scene 12 (shot 13, Settings) |
| Science ↔ Art dial | Shown, scene 13 |
| Bloop motif | Shown (heard), scene 17 |
| Phone layout | Shown, scene 12 (shot 13) |

### Team

| Feature | Where |
|---|---|
| Team and about | Shown, scene 2 |

---

## Recording the demo

Record every demo shot as its own clip, so a mistake costs one take, not the whole run.

- **Setup:** OBS, 1920 × 1080, 60 fps, **system audio on**, a clean browser profile at 100% zoom, bookmarks bar hidden, notifications off. Use the live site, not localhost.
- **Screen reader:** NVDA with speech on, at a normal rate. In Bloop's settings, keep Speech mode on **My screen reader**, so NVDA does the talking (never both at once). Open NVDA's Braille Viewer (NVDA menu › Tools) for scene 9.
- **Use the keyboard**, not the mouse. The keycaps in the edit are drawn from what you actually pressed, so write the keys down as you go.
- **Record on the day you edit,** so "today" in the cold open is true. Note the frame date the app shows.
- **Before scene 14,** open Then vs Now's Details sheet and confirm it still says +1.37 °C and a clear falling trend for water. If the data has refreshed and a number changed, change the VO and on-screen text to match. The app is the source of truth, not this script.
- **For scene 12,** record each shot for 4–5 seconds. The editor picks the best second.

| Scene | What to record |
|---|---|
| 1, 6 | A3 on the Bay of Bengal, 20 s of sound only |
| 2 | Header › Team, held still for 15 s |
| 3 | A2 rain, needle on the heaviest rain near the coast, 20 s of sound only |
| 7 | The ocean voice at 29.8 °C, a sweep from cool to warm, rain light to heavy, the needle west to east |
| 8 | NVDA on. Home › Start listening › skip intro → Tab to the map → L → arrows, Shift+arrows → + / − → J, 5 → Enter → P → 2, 1 → north onto land → Esc |
| 9 | B → move the needle → R → Header › বাংলা, with NVDA's Braille Viewer visible |
| 10 | Alt+L → Z, then ] → Low-vision settings: Two-tone high contrast, larger text → Show NASA's original colours (→ Windows Magnifier, optional) |
| 12 | The 13 shots in the scene 12 table, about 5 s each |
| 13 | How we know, scrolled slowly → Listen, U → Credits › "Used in our testing (not playable)" → Settings › dial from Measure to Music → Check the data voice, held on the result |
| 14 | Then vs Now: City › Dhaka, Part › Heat, Play this part, played through → Part › Water underground with Details open |
| 17 | Settings › Play the Bloop motif, sound only |

---

## Every fact in this script, and where it comes from

Nothing goes on screen or into the VO unless it's in this table.

| Fact | Source |
|---|---|
| The challenge statement | Official Challenge #14 summary, quoted in `docs/TEAM_BUILD_PLAN.md` §1 |
| 43 million blind; 295 million with moderate or severe vision impairment (2020) | GBD 2019 Blindness and Vision Impairment Collaborators / Vision Loss Expert Group, *The Lancet Global Health* 9(2), 2021. **Open the paper and confirm both figures before recording.** |
| 21.5° N, 89.8° E → 29.8 °C → 735 Hz | `README.md`, "How a pixel becomes a sound" |
| Each step spoken once; Enter gives value and place; P gives the source | `docs/accessibility/ACCESSIBILITY.md`; `docs/FEATURES.md` |
| Braille in English UEB and Bengali grade 1, tested in NVDA's Braille Viewer; displays not tested | `docs/accessibility/BRAILLE.md` ("What we may say") |
| Low-vision preset (Alt+L), the Context Lens, re-colour schemes, NASA's colours in one press | `docs/FEATURES.md`; `docs/accessibility/MANUAL_TESTS.md` §1 |
| 23 official records (C1–C23); every record has a code | `docs/FEATURES.md` |
| Every feature plays from the keyboard | `docs/FEATURES.md` (every row has a key or a keyboard path); the Help list (H) |
| Ocean: 0.31 °C median error vs MUR; rain: about 27% vs IMERG | How we know, in the app; `README.md` |
| A frame that fails the check never plays | `README.md`, "From NASA to your ears" |
| U plays the map's tone and NASA's file tone together | `docs/FEATURES.md`, Proof in unison |
| NASA POWER dropped because it disagreed with independent records | `README.md`, Credits |
| Every note within 1 cent at every dial position, checked by the app | Check the data voice (`docs/statement/ART.md`; CI test `e2e/art/dial.e2e.ts`) |
| Dhaka April–May +1.37 °C, 1981–1990 vs 2016–2025 | `docs/THEN_VS_NOW_STATS.md` (95% range +0.88 to +1.86; clear) |
| Bangladesh groundwater falling since 2002, about 0.32 cm a year | `docs/THEN_VS_NOW_STATS.md`, full-record trend 2002–2026: −0.323 cm/yr (95% range −0.508 to −0.139; clear) |
| Blind and low-vision testing is next, not done | `docs/accessibility/ACCESSIBILITY.md` ("Validated with blind users… only after the YPSA session") |
| The Bloop: recorded 1997, ice breaking off Antarctica | NOAA, https://oceanservice.noaa.gov/facts/bloop.html |

Words we deliberately don't say: "validated with blind users", "tested with braille displays", "accessible to everyone", "monsoon rain is decreasing" (not statistically clear), "AI" anywhere near the numbers.

---

## Subtitles, and a video that works without sight

English subtitles are required. **Burn them in** (so the Drive file has them) **and** upload an `.srt` to YouTube.

- Archivo Medium, **44 px** at 1080p, centred in the bottom paper margin. Navy on paper, paper on night: both well above 7:1 contrast. No box needed.
- At most two lines, 42 characters a line, broken at natural phrase ends.
- Caption every voice that isn't ours too: *[NVDA: 29.6 degrees, Bay of Bengal]*, *[Bloop: 29.6 degrees]*.
- Bangla on screen gets an English subtitle in brackets.
- Time the `.srt` from the final edit, not from this script.
- **Listen to the final cut with the screen off, once, start to finish.** If any scene only makes sense with the picture, fix the VO, not the picture.

---

## Credits (YouTube description)

```
Bloop by Team PTSD (Chattogram, Bangladesh)
Dipika Nath · Samonwita Sarker · Pratik Dev · Arnob Mozumder · Rashed UL Islam
NASA Space Apps Challenge 2026, Challenge #14: The Earth Information Jukebox

Try it: https://bloop-ptsd.pages.dev
Code (MIT): https://github.com/PratikDev/bloop

NASA data
- Earth Information Center frames: NASA Scientific Visualization Studio, SVS 5101 and SVS 4285
- MUR sea surface temperature v4.1: NASA JPL PO.DAAC, doi:10.5067/GHGMR-4FJ04
- GPM IMERG half-hourly V07 (NASA and JAXA): NASA GES DISC, doi:10.5067/GPM/IMERG/3B-HH/07
- GISTEMP v4: NASA Goddard Institute for Space Studies
- GRACE / GRACE-FO JPL mascons RL06.3: NASA JPL PO.DAAC, doi:10.5067/TEMSC-3JC634
The full source list is in the app under How we know › Credits.

Other sources
- Blindness and vision impairment figures: GBD 2019 Blindness and Vision Impairment Collaborators, The Lancet Global Health, 2021
- The Bloop: NOAA Ocean Service

Sound: every sound in this video is generated live by Bloop's own code. No music, no samples.
Type: Archivo and Anek Bangla (SIL Open Font License).
Animation and editing: Arnob Mozumder. All drawings are our own.
AI use: AI tools helped write the app's code and draft this video's script (Claude, by Anthropic). The team edited every line. No image, voice, sound or number in this video is AI-generated.
Everyone who appears or speaks in this video is over 18.
```

---

## Before you upload

- [ ] The exported file is **3:55 or shorter**. Check the file's properties, not the timeline.
- [ ] All five requirements are in, at the timecodes in the table above.
- [ ] English subtitles are burned in, and the `.srt` is uploaded to YouTube. NVDA's speech is subtitled.
- [ ] The whole cut makes sense with the screen off.
- [ ] Every number on screen matches the app on the day of recording.
- [ ] The 43 million and 295 million figures have been checked against the paper.
- [ ] Scene 15's line matches what's actually planned with blind and low-vision testers.
- [ ] Nobody under 18 appears or is heard, including in the background of the real footage.
- [ ] The stereo panning survives the export (headphones: west left, east right).
- [ ] The credits are in the YouTube description.
- [ ] YouTube visibility is **Public** or **Unlisted**, not Private.
- [ ] The YouTube link, the Drive file and the portal submission each open in a private/incognito window.
- [ ] Uploaded by 5:30 PM.
