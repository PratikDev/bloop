# Bangla Strings to Translate

For the teammate translating the interface into Bangla.

**How to add a translation:** put it in `src/lib/i18n/bn.ts` under the same key, for example `"start.button": "শোনা শুরু করুন"`. Any key without a translation falls back to English.
- Rows marked "has values" are functions, because a number or place name is inserted into the sentence. Copy the English function from `src/lib/i18n/en/` and translate its text. Numbers are formatted in Bangla automatically when you pass `"bn"` to the format helpers.
- **§16 wording is translated by a person, never by a machine.** These rows are marked in the table.
- Voice names in the Mapping panel come from `public/mapping.json` (`label.bn`, owned by L2), not from this list. Entries there starting with `TODO:` still show English.
- Rows this doesn't list: the Mapping panel's rule sentences and global rules are English text from L2's `mapping.ts` and `mapping.json`. Bangla rule sentences need `ruleParts()` (planned for Phase 4).

## Interface

| Key | English | Bangla | Note |
|---|---|---|---|
| `app.title` | Earth Information Jukebox | TODO_BN |  |
| `app.skipToMap` | Skip to the sound map | TODO_BN |  |
| `start.lead` | Hear NASA's view of today's ocean and rain as live sound. | TODO_BN |  |
| `start.hint` | Headphones help: west sounds left, east sounds right. | TODO_BN |  |
| `start.button` | Start listening | TODO_BN |  |
| `start.silent` | Explore without sound | TODO_BN |  |
| `start.silentHint` | Values appear as text and captions. You can turn sound on at any time. | TODO_BN |  |
| `start.loading` | Loading today's ocean frame… | TODO_BN |  |
| `start.skipIntro` | Skip intro | TODO_BN |  |
| `mode.label` | Mode | TODO_BN |  |
| `mode.explore` | Explore | TODO_BN |  |
| `mode.story` | Story | TODO_BN |  |
| `mode.thenNow` | Then vs Now | TODO_BN |  |
| `mode.notReady` | Not ready yet | TODO_BN |  |
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
| `motif.play` | Play the Jukebox motif | TODO_BN |  |
| `help.open` | Help | TODO_BN |  |
| `help.keys` | Keys | TODO_BN |  |
| `panels.open` | Panels | TODO_BN |  |
| `badge.interimEngine` | Interim sound engine | TODO_BN |  |
| `badge.interimEngineHint` | A simple stand-in engine. The team's full sound engine replaces it soon. | TODO_BN |  |
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
| `xray.unavailable` | X-ray needs the colorbar data, which isn't published yet. | TODO_BN |  |
| `announce.track` | (sentence with values; see source) | TODO_BN | has values |
| `announce.mode` | (sentence with values; see source) | TODO_BN | has values |
| `announce.toggle` | (sentence with values; see source) | TODO_BN | has values |
| `announce.started` | Sound started. The cursor is over the Bay of Bengal. Arrow keys move it. | TODO_BN |  |
| `error.ocean` | Couldn't load today's ocean frame. Check the connection and reload the page. | TODO_BN |  |
| `error.rain` | Couldn't load today's rain frame. Ocean sound still works; reload the page to try again. | TODO_BN |  |

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
| `key.x.action` | X-ray: how a colour becomes a number and a sound | TODO_BN |  |
| `key.h.action` | Open this help | TODO_BN |  |
| `key.esc` | Esc | TODO_BN |  |
| `key.esc.action` | Stop all sound and close panels | TODO_BN |  |

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
| `caption.motif` | The Jukebox motif: four notes, one per band of ocean from south to north | TODO_BN |  |
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

## Panels

| Key | English | Bangla | Note |
|---|---|---|---|
| `panel.label` | About this sound | TODO_BN |  |
| `panel.truth` | Truth | TODO_BN |  |
| `panel.mapping` | Mapping | TODO_BN |  |
| `panel.provenance` | Provenance | TODO_BN |  |
| `panel.history` | History | TODO_BN |  |
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
| `mapping.global` | Rules for every sound | TODO_BN |  |
| `mapping.designChoice` | Our design choice, to be tested with listeners | TODO_BN |  |
| `mapping.silence` | Silence | TODO_BN |  |
| `mapping.source` | Data | TODO_BN |  |
| `mapping.hearLegend` | Hear the legend | TODO_BN |  |
| `mapping.status.verified` | Checked against the source | TODO_BN |  |
| `mapping.status.context` | Context record | TODO_BN |  |
| `mapping.status.designOnly` | Sound cue | TODO_BN |  |
| `provenance.notReady` | Provenance for the current point is not ready yet. | TODO_BN |  |

## Then vs Now and Place History

| Key | English | Bangla | Note |
|---|---|---|---|
| `thenNow.contextNote` | Context records, not EIC frames: long-term NASA and partner datasets for Bangladesh. | TODO_BN |  |
| `thenNow.parts` | Part | TODO_BN |  |
| `thenNow.part.heat` | Heat | TODO_BN |  |
| `thenNow.part.monsoon` | Monsoon rain | TODO_BN |  |
| `thenNow.part.water` | Water underground | TODO_BN |  |
| `thenNow.play` | Play this part | TODO_BN |  |
| `thenNow.playAll` | Play all three | TODO_BN |  |
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
| `history.intro` | One place's monthly record. Pick a decade to hear it month by month. | TODO_BN |  |
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
| `history.loading` | Loading the records… | TODO_BN |  |
| `history.error` | Couldn't load the records. Reload the page to try again. | TODO_BN |  |

