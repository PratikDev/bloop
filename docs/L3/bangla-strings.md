# Bangla Strings to Translate

For the teammate translating the interface into Bangla.

**Status (2 Oct): every string is translated** (draft, needs a review by a native Bangla speaker on the team). The translations are in `src/lib/i18n/bn/`, one file per English file in `src/lib/i18n/en/`, with the same keys. Each Bangla file is typed against its English twin, so a missing key fails `bunx tsc --noEmit`.

| What | Where | Note |
|---|---|---|
| Interface strings | `src/lib/i18n/bn/*.ts` | Functions with values use the `"bn"` number helpers, so digits are Bengali |
| Prose from the data files (L1's JSON, L2's `mapping.json`) | `src/lib/i18n/bn/data.ts` | Those files stay English. The app matches each sentence exactly, or by its fixed shape with the numbers taken from the sentence itself. A sentence L1 or L2 rewords shows in English until `data.ts` is updated; `bun test` (`data.test.ts`) lists any that fell back |
| Mapping panel rule sentences | `src/lib/i18n/bn/rules.ts` | Built from `ruleParts()`, the same numbers as the sound |
| Dataset, mission and credit names | unchanged | Stay English (plan §15) |

**Please review first:** the plan §16 wording, which is still marked "Pending team approval" on screen: `frame.label`, `field.fires.caption`, the Then vs Now captions (`data.ts`, heat, rain and water patterns), and the Truth sentences (`truth.*`).

Speech: `BANGLA_SPEECH_READY` is on. The built-in voice speaks Bangla when the device has a Bangla voice, and English (with Bangla on screen) when it doesn't (`src/lib/speech-lang.ts`).

The table below is the original list (written 28 Sep), kept for the reviewer as the key list. The `TODO_BN` marks in it are out of date.

## Priority: the video's closing shot (translate these first)

The video ends on the live app in Bangla mode, playing (team plan §14, 3:45 to 3:50). These are the strings on screen, or read by a screen reader, in that shot: the top bar, the readout, the frame label, the caption bar, the bottom bar's buttons, the credits and the Start screen.

**Count: 45 strings** (before the redesign; its new Listen page strings are in "Pages" below). 39 to translate in full, 3 credits lines to translate only their lead-in words, and 3 frame-label strings to **keep English until team approves** (§16 wording). Put each translation in `src/lib/i18n/bn.ts`; the full list below has the same keys.

| Where | Key | English | Note |
|---|---|---|---|
| Top bar | `app.title` | Bloop |  |
| Top bar | `mode.explore` | Explore |  |
| Top bar | `mode.story` | Tour |  |
| Top bar | `mode.thenNow` | Then vs Now |  |
| Top bar | `track.label` | What you hear | screen-reader label |
| Top bar | `track.ocean` | Ocean |  |
| Top bar | `track.rain` | Rain |  |
| Top bar | `track.both` | Both |  |
| Top bar | `settings.describe` | Describe |  |
| Top bar | `settings.language` | Language | screen-reader label |
| Top bar | `help.open` | Help | screen-reader label |
| Top bar | `motif.play` | Play the Bloop motif | screen-reader label |
| Readout (on the map) | `reading.oceanValue` | (sentence with values; see source) | has values |
| Readout (on the map) | `reading.oceanNone` | No ocean data here |  |
| Readout (on the map) | `reading.rainValue` | (sentence with values; see source) | has values |
| Readout (on the map) | `reading.dry` | Dry |  |
| Readout (on the map) | `reading.rainNone` | No rain data here |  |
| Readout (on the map) | `reading.rainLoading` | Rain is still loading |  |
| Readout (on the map) | `unit.celsius` | °C |  |
| Readout (on the map) | `unit.mmPerHour` | mm/h |  |
| Readout (on the map) | `place.latlon` | (sentence with values; see source) | has values |
| Frame label | `frame.label` | (sentence with values; see source) | §16 wording: keep English until team approves; has values |
| Frame label | `frame.product.ocean` | Ocean temperature | §16 wording: keep English until team approves (inside the frame label) |
| Frame label | `frame.product.rain` | Rain and snow | §16 wording: keep English until team approves (inside the frame label) |
| Caption bar (live exploring) | `caption.value` | (sentence with values; see source) | has values |
| Caption bar (live exploring) | `caption.nodata` | (sentence with values; see source) | has values |
| Bottom bar | `sound.pause` | Pause sound | shown while playing |
| Bottom bar | `mixer.label` | Mixer | button on smaller screens |
| Bottom bar | `sweep.play` | Play sweep |  |
| Bottom bar | `timelapse.play` | Play storm time-lapse |  |
| Bottom bar | `help.keys` | Keys |  |
| Bottom bar | `mixer.snow` | Snow | mixer, wide screens |
| Bottom bar | `mixer.muteShort` | Mute | mixer, wide screens |
| Bottom bar | `mixer.soloShort` | Solo | mixer, wide screens |
| Credits | `credits.visualizations` | Visualizations: NASA's Scientific Visualization Studio (SVS 5101, 4285) for the NASA Earth Information Center. | §15: translate only the lead-in; names stay English |
| Credits | `credits.data` | Data in this app: MUR SST (NASA/JPL PO.DAAC); GPM IMERG (NASA/JAXA, GES DISC); GRACE/GRACE-FO JPL mascons RL06.3Mv04 (NASA/JPL PO.DAAC); NASA GISTEMP v4; GPCP v2.3 and GPCC Full Data v2020 (via NOAA PSL); NASA FIRMS; MODIS MOD13Q1 via ORNL DAAC; NASA GLOBE Program. | §15: translate only "Data in this app:"; names stay English |
| Credits | `credits.testing` | Also used in our testing: NASA POWER (dropped: it disagreed with independent records). | §15: translate only "Also used in our testing:"; names stay English |
| Start screen | `start.lead` | Hear NASA's view of the latest ocean and rain as live sound. |  |
| Start screen | `start.hint` | Headphones help: west sounds left, east sounds right. |  |
| Start screen | `start.button` | Start listening |  |
| Start screen | `start.silent` | Explore without sound |  |
| Start screen | `start.silentHint` | Values appear as text and captions. You can turn sound on at any time. |  |
| Start screen | `start.loading` | Loading the latest ocean frame… |  |

## Interface

| Key | English | Bangla | Note |
|---|---|---|---|
| `app.title` | Bloop | TODO_BN |  |
| `start.lead` | Hear NASA's view of the latest ocean and rain as live sound. | TODO_BN |  |
| `start.hint` | Headphones help: west sounds left, east sounds right. | TODO_BN |  |
| `start.button` | Start listening | TODO_BN |  |
| `start.silent` | Explore without sound | TODO_BN |  |
| `start.silentHint` | Values appear as text and captions. You can turn sound on at any time. | TODO_BN |  |
| `start.loading` | Loading the latest ocean frame… | TODO_BN |  |
| `start.skipIntro` | Skip intro | TODO_BN |  |
| `mode.explore` | Explore | TODO_BN |  |
| `mode.story` | Tour | TODO_BN |  |
| `mode.thenNow` | Then vs Now | TODO_BN |  |
| `track.label` | What you hear | TODO_BN |  |
| `track.ocean` | Ocean | TODO_BN |  |
| `track.rain` | Rain | TODO_BN |  |
| `track.both` | Both | TODO_BN |  |
| `track.oceanLong` | Ocean temperature | TODO_BN |  |
| `track.rainLong` | Rain and snow | TODO_BN |  |
| `settings.describe` | Describe | TODO_BN |  |
| `settings.captions` | Captions | TODO_BN |  |
| `settings.builtInVoice` | Built-in voice | TODO_BN |  |
| `settings.reduceMotion` | Reduce motion | TODO_BN |  |
| `settings.language` | Language | TODO_BN |  |
| `settings.open` | Settings | TODO_BN |  |
| `lang.en` | English | TODO_BN |  |
| `lang.bn` | বাংলা | TODO_BN |  |
| `motif.play` | Play the Bloop motif | TODO_BN |  |
| `help.open` | Help | TODO_BN |  |
| `help.keys` | Keys | TODO_BN |  |
| `badge.pending` | Pending team approval | TODO_BN |  |
| `badge.comingOctober` | Coming in October | TODO_BN |  |
| `badge.loadingRain` | Loading rain… | TODO_BN |  |
| `map.roleDescription` | sound map | TODO_BN |  |
| `map.instructions` | Arrow keys move 1 degree, Shift with arrows moves 10. Enter speaks the value. H lists all keys. | TODO_BN |  |
| `map.alt` | (sentence with values; see source) | TODO_BN | has values |
| `place.latlon` | (sentence with values; see source) | TODO_BN | has values |
| `place.spoken` | (sentence with values; see source) | TODO_BN | has values |
| `unit.celsius` | °C | TODO_BN |  |
| `unit.mmPerHour` | mm/h | TODO_BN |  |
| `reading.oceanValue` | (sentence with values; see source) | TODO_BN | has values |
| `reading.oceanNone` | No ocean data here | TODO_BN |  |
| `reading.rainValue` | (sentence with values; see source) | TODO_BN | has values |
| `reading.dry` | Dry | TODO_BN |  |
| `reading.rainNone` | No rain data here | TODO_BN |  |
| `reading.rainLoading` | Rain is still loading | TODO_BN |  |
| `speak.ocean` | (sentence with values; see source) | TODO_BN | has values |
| `speak.oceanNone` | No ocean data here | TODO_BN |  |
| `speak.rain` | (sentence with values; see source) | TODO_BN | has values |
| `speak.dry` | Dry | TODO_BN |  |
| `speak.rainNone` | No rain data here | TODO_BN |  |
| `speak.value` | (sentence with values; see source) | TODO_BN | has values |
| `frame.product.ocean` | Ocean temperature | TODO_BN |  |
| `frame.product.rain` | Rain and snow | TODO_BN |  |
| `frame.label` | (sentence with values; see source) | TODO_BN | **§16 wording: human translation only** |
| `sound.pause` | Pause sound | TODO_BN |  |
| `sound.play` | Play sound | TODO_BN |  |
| `sound.paused` | Sound paused | TODO_BN |  |
| `sound.resumed` | Sound on | TODO_BN |  |
| `sound.muteAll` | Mute all | TODO_BN |  |
| `sound.unmuteAll` | Unmute all | TODO_BN |  |
| `sound.stopped` | Stopped | TODO_BN |  |
| `sound.turnOn` | Turn sound on | TODO_BN |  |
| `sound.offHint` | Sound is off. Choose Turn sound on to hear it. | TODO_BN |  |
| `mixer.label` | Mixer | TODO_BN |  |
| `mixer.snow` | Snow | TODO_BN |  |
| `mixer.muteShort` | Mute | TODO_BN |  |
| `mixer.soloShort` | Solo | TODO_BN |  |
| `mixer.volume` | (sentence with values; see source) | TODO_BN | has values |
| `mixer.mute` | (sentence with values; see source) | TODO_BN | has values |
| `mixer.solo` | (sentence with values; see source) | TODO_BN | has values |
| `sweep.play` | Play sweep | TODO_BN |  |
| `sweep.needsRain` | The sweep starts once rain has loaded. | TODO_BN |  |
| `xray.unavailable` | X-ray is coming in October: it needs NASA's colorbar data, which isn't published yet. | TODO_BN |  |
| `announce.track` | (sentence with values; see source) | TODO_BN | has values |
| `announce.mode` | (sentence with values; see source) | TODO_BN | has values |
| `announce.toggle` | (sentence with values; see source) | TODO_BN | has values |
| `announce.started` | Sound started. The cursor is over the Bay of Bengal. Arrow keys move it. | TODO_BN |  |
| `error.ocean` | Couldn't load the latest ocean frame. Check the connection and reload the page. | TODO_BN |  |
| `error.rain` | Couldn't load the latest rain frame. Ocean sound still works; reload the page to try again. | TODO_BN |  |
| `speak.approx` | about  | TODO_BN | spoken in place of "~" (keep a trailing space) |
| `timelapse.play` | Play storm time-lapse | TODO_BN |  |
| `timelapse.stop` | Stop time-lapse | TODO_BN |  |
| `timelapse.loadingStart` | Loading the time-lapse frames… | TODO_BN |  |
| `timelapse.loading` | (sentence with values; see source) | TODO_BN | has values |
| `timelapse.loadingShort` | (sentence with values; see source) | TODO_BN | has values; on the time-lapse button while it loads |
| `timelapse.error` | Couldn't load the time-lapse frames. Reload the page to try again. | TODO_BN |  |
| `timelapse.announceStart` | (sentence with values; see source) | TODO_BN | has values |
| `timelapse.frame` | (sentence with values; see source) | TODO_BN | has values |
| `credits.visualizations` | Visualizations: NASA's Scientific Visualization Studio (SVS 5101, 4285) for the NASA Earth Information Center. | TODO_BN | §15 wording; dataset names stay in English |
| `credits.data` | Data in this app: MUR SST (NASA/JPL PO.DAAC); GPM IMERG (NASA/JAXA, GES DISC); GRACE/GRACE-FO JPL mascons RL06.3Mv04 (NASA/JPL PO.DAAC); NASA GISTEMP v4; GPCP v2.3 and GPCC Full Data v2020 (via NOAA PSL); NASA FIRMS; MODIS MOD13Q1 via ORNL DAAC; NASA GLOBE Program. | TODO_BN | §15 wording; dataset names stay in English |
| `place.Chattogram` | Chattogram | TODO_BN | place name |
| `place.Dhaka` | Dhaka | TODO_BN | place name |
| `place.Rajshahi` | Rajshahi | TODO_BN | place name |
| `place.Sylhet` | Sylhet | TODO_BN | place name |
| `credits.testing` | Also used in our testing: NASA POWER (dropped: it disagreed with independent records). | TODO_BN |  |

## Help

| Key | English | Bangla | Note |
|---|---|---|---|
| `help.title` | Keys and help | TODO_BN |  |
| `help.focusNote` | Letter keys work while the sound map has focus, so they don't clash with screen reader keys. Esc works everywhere. | TODO_BN |  |
| `help.voiceNote` | If you use a screen reader, you may prefer to turn off the built-in voice: the screen reader already reads values aloud. | TODO_BN |  |
| `help.keyColumn` | Key | TODO_BN |  |
| `help.actionColumn` | What it does | TODO_BN |  |
| `key.arrows` | Arrow keys | TODO_BN |  |
| `key.arrows.action` | Move the cursor 1 degree (with Shift: 10 degrees) | TODO_BN |  |
| `key.enter.action` | Speak the value and the place | TODO_BN |  |
| `key.space` | Space | TODO_BN |  |
| `key.space.action` | Pause or resume the live sound | TODO_BN |  |
| `key.s.action` | Play the sweep outward from Chattogram | TODO_BN |  |
| `key.123.action` | Hear ocean, rain, or both | TODO_BN |  |
| `key.m.action` | Mute or unmute everything | TODO_BN |  |
| `key.d.action` | Describe mode on or off | TODO_BN |  |
| `key.c.action` | Captions on or off | TODO_BN |  |
| `key.t.action` | Then vs Now | TODO_BN |  |
| `key.l.action` | Hear the legend (reference sounds) | TODO_BN |  |
| `key.p.action` | Where this value comes from | TODO_BN |  |
| `key.x.action` | X-ray: how a colour becomes a number and a sound (coming in October) | TODO_BN |  |
| `key.h.action` | Open this help | TODO_BN |  |
| `key.esc` | Esc | TODO_BN |  |
| `key.esc.action` | Stop all sound and close panels | TODO_BN |  |
| `october.heading` | Not built yet | TODO_BN |  |
| `october.xray` | X-ray: how a colour becomes a number and a sound (waits for NASA's colorbar data) | TODO_BN |  |
| `october.aiByEar` | "Check the AI by ear" and "Ask the Earth", a voice agent (the AI never produces numbers) | TODO_BN |  |
| `october.study` | A listening study with blind and low-vision adults | TODO_BN |  |
| `october.choirs` | The full Anomaly Choir and Change Choir | TODO_BN |  |
| `october.passes` | Satellite-pass cues ("who measured this?") | TODO_BN |  |
| `october.raga` | Raga music mode | TODO_BN |  |
| `october.duets` | NASA vs JAXA (GSMaP) and NASA vs UK Met Office (OSTIA) duets | TODO_BN |  |
| `october.tracks` | More EIC tracks: fires, air quality, wind | TODO_BN |  |
| `october.kiosk` | Kiosk and hyperwall mode | TODO_BN |  |

## Captions (sound events)

| Key | English | Bangla | Note |
|---|---|---|---|
| `caption.value` | (sentence with values; see source) | TODO_BN | has values |
| `caption.nodata` | (sentence with values; see source) | TODO_BN | has values |
| `caption.sweep.start` | Sweeping outward from Chattogram | TODO_BN |  |
| `caption.sweep.end` | Sweep finished | TODO_BN |  |
| `caption.legend` | (sentence with values; see source) | TODO_BN | has values |
| `caption.legendUnavailable` | That legend comes with Then vs Now | TODO_BN |  |
| `caption.warmup.start` | Warm-up: set a comfortable volume while the reference sounds play | TODO_BN |  |
| `caption.warmup.end` | Warm-up finished | TODO_BN |  |
| `caption.motif` | The Bloop motif: four notes, one per band of ocean from south to north | TODO_BN |  |
| `caption.opening.closeEyes` | Close your eyes. | TODO_BN |  |
| `caption.opening.openEyes` | Now open your eyes. | TODO_BN |  |
| `caption.stopped` | All sound stopped | TODO_BN |  |
| `caption.earcon.nodata` | Tick: no data here | TODO_BN |  |
| `caption.earcon.whisper` | (sentence with values; see source) | TODO_BN | has values |
| `caption.earcon.ping` | Ping: the extreme value in view | TODO_BN |  |
| `caption.thenNow.caption` | (sentence with values; see source) | TODO_BN | has values |
| `caption.thenNow.window` | (sentence with values; see source) | TODO_BN | has values |
| `caption.thenNow.end` | Then vs Now finished | TODO_BN |  |
| `caption.water.gap` | (sentence with values; see source) | TODO_BN | has values |
| `caption.water.windowStart` | (sentence with values; see source) | TODO_BN | has values |
| `caption.water.windowEnd` | (sentence with values; see source) | TODO_BN | has values |
| `caption.compare.side` | (sentence with values; see source) | TODO_BN | has values |
| `caption.compare.useHeadphones` | (sentence with values; see source) | TODO_BN | has values |
| `caption.noBanglaVoice` | This device has no Bangla voice, so the value is shown but not spoken | TODO_BN |  |
| `caption.noSpeech` | This browser can't speak; the value is shown instead | TODO_BN |  |
| `caption.timelapse.start` | (sentence with values; see source) | TODO_BN | has values |
| `caption.timelapse.peak` | (sentence with values; see source) | TODO_BN | has values |
| `caption.timelapse.end` | Time-lapse finished | TODO_BN |  |
| `caption.history.end` | History finished | TODO_BN |  |
| `caption.speech` | (sentence with values; see source) | TODO_BN | has values |

## Panels

| Key | English | Bangla | Note |
|---|---|---|---|
| `panel.label` | About this sound | TODO_BN |  |
| `panel.truth` | Checks | TODO_BN |  |
| `panel.mapping` | What you hear | TODO_BN |  |
| `panel.provenance` | Where it's from | TODO_BN |  |
| `truth.intro` | We read each value back from the frame's colours, then checked those values against NASA's source data. | TODO_BN |  |
| `truth.ocean.heading` | Ocean temperature | TODO_BN |  |
| `truth.ocean.updating` | Verification being updated | TODO_BN |  |
| `truth.ocean.updatingNote` | The ocean colorbar was recalibrated, and the new error is waiting for a check on a separate frame before we show it. | TODO_BN |  |
| `truth.rain.heading` | Rain | TODO_BN |  |
| `truth.rain.sentence` | (sentence with values; see source) | TODO_BN | **§16 wording: human translation only** |
| `truth.rain.plotAlt` | Scatter plot: rain rate read from the EIC frame against NASA IMERG at the same points, on logarithmic axes. | TODO_BN |  |
| `truth.checkedOn` | (sentence with values; see source) | TODO_BN | has values |
| `truth.rain.plotCaption` | (sentence with values; see source) | TODO_BN | has values |
| `mapping.intro` | Every sound follows a written rule. The same numbers drive the sound engine, so this page and the sound can't disagree. | TODO_BN |  |
| `mapping.live` | What you hear on the map | TODO_BN |  |
| `mapping.thenNow` | What you hear in Then vs Now | TODO_BN |  |
| `mapping.notPlayed` | Written, but not played yet | TODO_BN |  |
| `mapping.global` | Rules for every sound | TODO_BN |  |
| `mapping.designChoice` | Our design choice, to be tested with listeners | TODO_BN |  |
| `mapping.silence` | Silence | TODO_BN |  |
| `mapping.source` | Data | TODO_BN |  |
| `mapping.hearLegend` | Hear the legend | TODO_BN |  |
| `mapping.status.verified` | Checked against the source | TODO_BN |  |
| `mapping.status.context` | Context record | TODO_BN |  |
| `mapping.status.designOnly` | Sound cue | TODO_BN |  |
| `provenance.at` | (sentence with values; see source) | TODO_BN | has values |
| `provenance.value` | Value | TODO_BN |  |
| `provenance.dataset` | Dataset | TODO_BN |  |
| `provenance.visualization` | Visualization | TODO_BN |  |
| `provenance.svs` | (sentence with values; see source) | TODO_BN | has values |
| `provenance.frameTime` | Frame time | TODO_BN |  |
| `provenance.utc` | (sentence with values; see source) | TODO_BN | has values |
| `provenance.check` | Check | TODO_BN |  |
| `provenance.checkIsLatest` | (sentence with values; see source) | TODO_BN | has values |
| `truth.ocean.sentence` | (sentence with values; see source) | TODO_BN | L1's template; has values |
| `truth.ocean.recheck` | (sentence with values; see source) | TODO_BN | has values |
| `truth.rain.recheck` | (sentence with values; see source) | TODO_BN | has values |
| `globe.teaser` | Teaser: coming in October | TODO_BN | badge |
| `globe.plan` | Citizen observers vs satellite: two perspectives, not right vs wrong. | TODO_BN |  |
| `globe.featured` | (sentence with values; see source) | TODO_BN | has values |
| `globe.summary` | (sentence with values; see source) | TODO_BN | has values |

## Then vs Now and Place History

| Key | English | Bangla | Note |
|---|---|---|---|
| `thenNow.contextNote` | Context records, not EIC frames: long-term NASA and partner datasets for Bangladesh. | TODO_BN |  |
| `thenNow.parts` | Part | TODO_BN |  |
| `thenNow.part.heat` | Heat | TODO_BN |  |
| `thenNow.part.monsoon` | Monsoon rain | TODO_BN |  |
| `thenNow.part.water` | Water underground | TODO_BN |  |
| `thenNow.play` | Play this part | TODO_BN |  |
| `thenNow.playAll` | Play heat, rain and water | TODO_BN |  |
| `thenNow.split` | Then left, now right | TODO_BN |  |
| `thenNow.stop` | Stop | TODO_BN |  |
| `thenNow.soundOff` | Sound is off. Turn sound on to hear this comparison. | TODO_BN |  |
| `thenNow.loading` | Loading the comparison… | TODO_BN |  |
| `thenNow.error` | Couldn't load the comparison data. Reload the page to try again. | TODO_BN |  |
| `thenNow.then` | (sentence with values; see source) | TODO_BN | has values |
| `thenNow.now` | (sentence with values; see source) | TODO_BN | has values |
| `thenNow.unit.anomaly` | °C anomaly | TODO_BN |  |
| `thenNow.unit.mmPerDay` | mm/day | TODO_BN |  |
| `thenNow.unit.cm` | cm | TODO_BN |  |
| `thenNow.summary.yearly` | (sentence with values; see source) | TODO_BN | has values |
| `thenNow.water.played` | Bangladesh (you hear this) | TODO_BN |  |
| `thenNow.water.notPlayed` | NW India (shown for comparison, not played) | TODO_BN |  |
| `thenNow.water.shading` | Shaded: the two comparison windows, and months with no satellite measurements. | TODO_BN |  |
| `thenNow.water.summary` | (sentence with values; see source) | TODO_BN | has values |
| `disclosure.title` | How this comparison is made | TODO_BN |  |
| `disclosure.dataset` | Dataset | TODO_BN |  |
| `disclosure.window` | (sentence with values; see source) | TODO_BN | has values |
| `disclosure.mean` | (sentence with values; see source) | TODO_BN | has values |
| `disclosure.spread` | (sentence with values; see source) | TODO_BN | has values |
| `disclosure.change` | (sentence with values; see source) | TODO_BN | has values |
| `disclosure.crossCheck` | Cross-check, rain gauges (GPCC, not played) | TODO_BN |  |
| `disclosure.box` | (sentence with values; see source) | TODO_BN | has values |
| `disclosure.gapNote` | Gap | TODO_BN |  |
| `disclosure.notClaimed` | What we don't claim | TODO_BN |  |
| `disclosure.pending` | Caption shown exactly as the data file gives it, until the team approves final wording. | TODO_BN |  |
| `history.intro` | One place's monthly record. Pick a decade to hear it month by month, or drag along the chart to hear one month. | TODO_BN |  |
| `history.place` | Place | TODO_BN |  |
| `history.metric` | Record | TODO_BN |  |
| `history.heat` | Heat | TODO_BN |  |
| `history.rain` | Rain | TODO_BN |  |
| `history.decade` | Decade | TODO_BN |  |
| `history.decadeLabel` | (sentence with values; see source) | TODO_BN | has values |
| `history.play` | (sentence with values; see source) | TODO_BN | has values |
| `history.unit.heat` | °C anomaly | TODO_BN |  |
| `history.unit.rain` | mm/day | TODO_BN |  |
| `history.sharedCell` | (sentence with values; see source) | TODO_BN | has values |
| `history.cell` | (sentence with values; see source) | TODO_BN | has values |
| `history.summary` | (sentence with values; see source) | TODO_BN | has values |
| `history.scrub` | (sentence with values; see source) | TODO_BN | has values; the chart's name as a slider (screen readers) |
| `history.monthValue` | (sentence with values; see source) | TODO_BN | has values; the month and value while dragging along the chart |
| `history.loading` | Loading the records… | TODO_BN |  |
| `history.error` | Couldn't load the records. Reload the page to try again. | TODO_BN |  |
| `thenNow.title` | (sentence with values; see source) | TODO_BN | has values |
| `thenNow.city` | City | TODO_BN |  |
| `thenNow.computed` | Computed, same method as Dhaka. Only Dhaka's records were cross-checked against independent records. | TODO_BN |  |
| `thenNow.waterNational` | Water underground is one national record (the Bangladesh box), the same for every city. | TODO_BN |  |
| `thenNow.crosscheckAlt` | Two charts for Dhaka. Top: June to September rain since the 1890s from rain gauges (GPCC), GPCP and NASA POWER; POWER reads far below the other two. Bottom: April to May daily maximum temperature from NASA POWER and a weather station; POWER runs well above the station. | TODO_BN | image description, read by screen readers |
| `thenNow.moreTitle` | More records, then vs now | TODO_BN |  |
| `thenNow.part.fires` | Fires | TODO_BN |  |
| `thenNow.part.vegetation` | Vegetation | TODO_BN |  |
| `field.soundOctober` | No sound for this record yet: coming in October | TODO_BN | badge |
| `field.rule` | Rule | TODO_BN |  |
| `field.caveat` | Caveat | TODO_BN |  |
| `field.credit` | Credit | TODO_BN |  |
| `field.fires.region` | Region | TODO_BN |  |
| `field.fires.region.CHT_Bangladesh_MarApr` | Chittagong Hill Tracts, March–April | TODO_BN |  |
| `field.fires.region.Punjab_India_OctNov` | Punjab (India), October–November | TODO_BN |  |
| `field.fires.unit` | fires per day | TODO_BN |  |
| `field.fires.summary` | (sentence with values; see source) | TODO_BN | has values |
| `field.fires.caption` | (sentence with values; see source) | TODO_BN | has values |
| `field.veg.point` | Place | TODO_BN |  |
| `field.veg.point.Sundarbans` | Sundarbans | TODO_BN |  |
| `field.veg.point.Madhupur_forest` | Madhupur forest | TODO_BN |  |
| `field.veg.point.Dhaka_city_control` | Dhaka city (control) | TODO_BN |  |
| `field.veg.unit` | NDVI | TODO_BN |  |
| `field.veg.summary` | (sentence with values; see source) | TODO_BN | has values |
| `field.veg.caption` | (sentence with values; see source) | TODO_BN | has values |
| `history.water` | Water | TODO_BN |  |
| `history.unit.water` | cm | TODO_BN |  |
| `history.group.bangladesh` | Bangladesh | TODO_BN |  |
| `history.group.world` | World | TODO_BN |  |
| `history.loadingWorld` | Loading this record for the world (a few megabytes, first time only)… | TODO_BN |  |
| `history.noValue` | (sentence with values; see source) | TODO_BN | has values |
| `history.sharedRegion` | (sentence with values; see source) | TODO_BN | has values |
| `history.neighbour` | (the nearest land cell; the place's own cell is sea) | TODO_BN |  |
| `history.nationalBox` | Bangladesh national box (GRACE): one record for the whole country, the same for every city. | TODO_BN |  |
| `history.confidence.high` | Rain confidence: high (GPCP agrees closely with independent rain gauges here) | TODO_BN |  |
| `history.confidence.medium` | Rain confidence: medium (GPCP roughly agrees with independent rain gauges here) | TODO_BN |  |
| `history.confidence.low` | Rain confidence: low (GPCP and independent rain gauges disagree here) | TODO_BN |  |
| `history.confidence.satellite-only` | Rain confidence: satellite only (no rain gauges to check against here, for example at sea) | TODO_BN |  |
| `history.computed` | Computed from NASA GISTEMP / GPCP / GRACE with the same method as Dhaka; not separately cross-checked. | TODO_BN |  |
| `thenNow.powerTitle` | Why we don't use NASA POWER here | TODO_BN |  |
| `thenNow.listen` | Listen | TODO_BN |  |
| `thenNow.noSound` | (no sound yet) | TODO_BN |  |
| `field.place` | Place | TODO_BN |  |
| `field.sources` | Where these numbers come from | TODO_BN |  |

## Pages (redesign, 29 Sep)

The redesign splits the app into Home, Listen, Then vs Now and How we know (docs/L3/REDESIGN.md). These are its new strings: the navigation, Home, the intro, the Listen page's hint and dock, the Then vs Now views, the How we know tiles and the "no signal" page. The Inspector's tab names changed too (`panel.truth`, `panel.mapping`, `panel.provenance`, above). For the video's closing shot (the Listen page), translate the `nav.*`, `listen.title`, `dock.*`, `tour.start` and `inspector.open` rows first.

| Key | English | Bangla | Note |
|---|---|---|---|
| `app.skipToContent` | Skip to content | TODO_BN |  |
| `nav.label` | Pages | TODO_BN |  |
| `nav.home` | Bloop, home | TODO_BN |  |
| `nav.listen` | Listen | TODO_BN |  |
| `nav.thenNow` | Then vs Now | TODO_BN |  |
| `nav.how` | How we know | TODO_BN |  |
| `nav.howShort` | How | TODO_BN |  |
| `home.eyebrow` | NASA Earth Information Center · latest frames | TODO_BN |  |
| `home.titleLead` | Listen to | TODO_BN |  |
| `home.titleAccent` | Earth's latest frames. | TODO_BN |  |
| `home.continue` | Continue listening | TODO_BN |  |
| `home.stations` | Three ways in | TODO_BN |  |
| `home.station.listen` | Move across the latest NASA frame and hear the ocean and rain under the cursor. | TODO_BN |  |
| `home.station.thenNow` | Hear how heat, monsoon rain and water underground in Bangladesh have changed. | TODO_BN |  |
| `home.station.how` | How each value was checked against NASA's source data, and every rule behind the sound. | TODO_BN |  |
| `opening.label` | Intro | TODO_BN |  |
| `opening.escHint` | or press Esc | TODO_BN |  |
| `listen.title` | Latest ocean and rain, as sound | TODO_BN |  |
| `listen.panel` | Under the cursor | TODO_BN | screen-reader label |
| `listen.hint` | Tap or drag on the map, or use the arrow keys, to hear another place. | TODO_BN |  |
| `listen.hintDismiss` | Got it | TODO_BN |  |
| `tour.start` | Take the tour | TODO_BN |  |
| `dock.short.sweep` | Sweep | TODO_BN |  |
| `dock.short.timelapse` | Storm | TODO_BN |  |
| `dock.label.timelapse` | Storm time-lapse | TODO_BN |  |
| `dock.short.stop` | Stop | TODO_BN |  |
| `dock.short.tour` | Tour | TODO_BN |  |
| `dock.short.mixer` | Mixer | TODO_BN |  |
| `dock.short.inspector` | About | TODO_BN |  |
| `dock.short.goto` | Go to | TODO_BN |  |
| `goto.open` | Go to a latitude and longitude | TODO_BN | screen-reader label |
| `goto.title` | Go to a place | TODO_BN |  |
| `goto.lat` | Latitude | TODO_BN |  |
| `goto.lon` | Longitude | TODO_BN |  |
| `goto.hint` | In degrees. North and east are positive, south and west negative, or add N, S, E or W. You can paste both, like 23.8, 90.4. | TODO_BN | the fields also accept Bengali digits; N, S, E, W stay Latin letters |
| `goto.submit` | Go | TODO_BN |  |
| `goto.badLat` | Latitude is a number from -90 to 90 (or add N or S). | TODO_BN |  |
| `goto.badLon` | Longitude is a number from -180 to 180 (or add E or W). | TODO_BN |  |
| `dock.label` | Sound | TODO_BN |  |
| `inspector.open` | About this sound | TODO_BN |  |
| `inspector.close` | Close | TODO_BN |  |
| `thenNow.pageLead` | Decades of NASA and partner records for Bangladesh and the world, as sound. | TODO_BN |  |
| `thenNow.view` | View | TODO_BN |  |
| `thenNow.view.compare` | Compare decades | TODO_BN |  |
| `thenNow.view.monthly` | Month by month | TODO_BN |  |
| `thenNow.details` | Details | TODO_BN |  |
| `how.lead` | We read each value back from the frame's colours, then checked it against NASA's source data. Every sound follows a written rule. | TODO_BN |  |
| `how.ocean.figure` | median error against NASA MUR SST | TODO_BN |  |
| `how.ocean.value` | (sentence with values; see source) | TODO_BN | has values |
| `how.rain.figure` | typical difference from NASA IMERG | TODO_BN |  |
| `how.rain.value` | (sentence with values; see source) | TODO_BN | has values |
| `how.rules.title` | Sound rules | TODO_BN |  |
| `how.rules.figure` | sounds, each following a written rule | TODO_BN |  |
| `how.rules.value` | (sentence with values; see source) | TODO_BN | has values |
| `how.globe.title` | Ground vs satellite | TODO_BN |  |
| `how.globe.figure` | of place-days within 25 points of each other | TODO_BN |  |
| `how.globe.value` | (sentence with values; see source) | TODO_BN | has values |
| `how.open` | Read the full check | TODO_BN |  |
| `how.openRules` | See every rule | TODO_BN |  |
| `how.openGlobe` | Read the teaser | TODO_BN |  |
| `how.credits` | Credits | TODO_BN |  |
| `how.keys` | Keys and accessibility | TODO_BN |  |
| `notFound.title` | No signal here | TODO_BN |  |
| `notFound.text` | This page doesn't exist. The latest frames are still live on the map. | TODO_BN |  |
| `notFound.back` | Go to Listen | TODO_BN |  |

## Satellite whisper

| Key | English | Bangla | Note |
|---|---|---|---|
| `whisper.withRun` | (sentence with values; see source) | TODO_BN | has values |
| `whisper.and` |  and  | TODO_BN | joins agency names, with a space either side |
| `whisper.mission` | (sentence with values; see source) | TODO_BN | has values |
| `whisper.dataset` | (sentence with values; see source) | TODO_BN | has values |
| `whisper.kind.sst` | sea surface temperature | TODO_BN |  |
| `whisper.kind.rain` | rain | TODO_BN |  |
| `whisper.announce` | (sentence with values; see source) | TODO_BN | has values |

## Story Mode

| Key | English | Bangla | Note |
|---|---|---|---|
| `story.heading` | The tour | TODO_BN |  |
| `story.step.hum` | Ocean hum | TODO_BN |  |
| `story.step.sweep` | Sweep from Chattogram | TODO_BN |  |
| `story.step.storm` | Storm time-lapse | TODO_BN |  |
| `story.step.whisper` | Satellite whisper | TODO_BN |  |
| `story.step.xray` | X-ray | TODO_BN |  |
| `story.step.truth` | How we know | TODO_BN |  |
| `story.stop` | Stop the tour | TODO_BN |  |
| `story.replay` | Play again | TODO_BN |  |
| `story.backToExplore` | Back to the map | TODO_BN |  |
| `story.source` | (sentence with values; see source) | TODO_BN | has values |
| `story.stopped` | Tour stopped. Back to the map. | TODO_BN |  |
| `story.hum` | (sentence with values; see source) | TODO_BN | has values |
| `story.sweep` | Now a sweep from Chattogram across the Bay. Warmer water sounds higher; rain sounds as drops. | TODO_BN |  |
| `story.sweepNoSound` | The sweep from Chattogram is a sound. Turn sound on to hear it. | TODO_BN |  |
| `story.storm` | (sentence with values; see source) | TODO_BN | has values |
| `story.stormNoSpan` | Rain around the heaviest storm, frame by frame. | TODO_BN |  |
| `story.stormPeak` | (sentence with values; see source) | TODO_BN | has values |
| `story.stormFailed` | The storm frames couldn't load, so this step is skipped. | TODO_BN |  |
| `story.whisper` | (sentence with values; see source) | TODO_BN | has values |
| `story.xraySkipped` | X-ray is coming in October: it waits for NASA's colorbar data. | TODO_BN |  |
| `story.truth` | (sentence with values; see source) | TODO_BN | the sentence inside is §16 wording (Pending team approval); has values |
| `story.truthLoading` | The rain check appears in the Truth panel once rain has loaded. | TODO_BN |  |
| `story.end` | (sentence with values; see source) | TODO_BN | has values; `close` is the translated `story.backToExplore`. Draft, not checked by a native speaker: এই ছিল একটি জায়গা। পৃথিবীর যেকোনো জায়গা শুনতে "{close}" বেছে নিন। |
