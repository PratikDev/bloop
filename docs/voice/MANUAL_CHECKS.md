# Ask Bloop: manual screen-reader checks

For the team, with NVDA and Chrome on Windows (spec §8.1). Build with `NEXT_PUBLIC_ASK_BLOOP=1` (and
`NEXT_PUBLIC_ASK_BLOOP_VOICE=1` for the voice steps), serve `out/`, open Listen. Record each run in
[REPORT.md](REPORT.md): date, NVDA and Chrome versions, pass or fail per step, what was heard.

TalkBack and Chrome on Android: not run. Bloop is built and shown as a desktop website (decided 8 Nov 2026).

1. **Reach it by Tab.** From the map, Tab forward. Expected: "Ask Bloop, button, collapsed"; Enter opens it and
   focus lands in "Ask or tell Bloop, edit". The map's own keys never reach the box, and the box's never reach the map.
2. **Type and hear once.** Type `what is the value here`, Enter. Expected: the answer is spoken exactly once (with
   Speech set to "My screen reader"), and it is the same value Enter on the map says. No double speech.
3. **Push to talk.** Press and hold the Speak button (or Alt+K), say `go to Dhaka`, release. Expected: "Listening.
   Release to stop." when it starts; the transcript appears in the box; the needle moves; "Moved to Dhaka." The
   sonification is quieter while listening and back to its level after.
4. **Every starter.** Say or type each of the five starters shown under the box. Expected: each answers; the
   navigation one moves the needle; none moves focus away from the box.
5. **The map still works.** Close the panel, Tab to the map, use the arrows, Enter, D. Expected: unchanged. Open the
   panel again and repeat: unchanged.
6. **Settings.** Switch Detail (Brief, Standard, Detailed) and Speech (My screen reader, Bloop's voice, Off) in the
   app's Settings, ask again. Expected: the answer follows both; "Bloop's voice" never also speaks through NVDA.
7. **Escape.** While listening, press Escape: listening stops, nothing runs. While Bloop's voice speaks an answer,
   press Escape: it stops.
