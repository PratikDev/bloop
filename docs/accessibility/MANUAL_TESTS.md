# Manual tests: accessibility core

What needs a person, with exact steps. The automated checks are in [RESULTS.md](RESULTS.md); what each feature does is in [ACCESSIBILITY.md](ACCESSIBILITY.md). Build: the production site (`bun run build`, then `python pipeline/health/static_server.py out 3000`) or the deployed preview. Record each run in RESULTS.md (date, browser, what you saw, pass or fail).

**Not built (desktop website only, agreed 8 Nov 2026), so not tested:** phone touch mode, Android vibration ticks, the tactile vocabulary card, TalkBack, iPhone checks and Android magnification. The spec's manual protocols for those are kept at the end, for a later build.

## 1. Windows Magnifier with low-vision mode

Windows Magnifier is built in: **Win + Plus** starts it, **Win + Esc** stops it, **Ctrl + Alt + M** cycles full screen / lens / docked. In Magnifier's settings (Win + Ctrl + M) tick **Follow the keyboard focus** and **Follow the text cursor**.

Run each task at **200%** and again at **400%**, first in **full-screen view**, then in **lens view**. Note the time each task takes and anything that was hard to find.

1. Open the site, Start listening, go to Listen. Press **Alt+L**. Expected: the page turns high-contrast dark with large text and controls; the Context Lens appears beside the needle; a legend appears next to the value. The magnifier should not jump away from where you were.
2. **Find the value at Chattogram.** Tab to the map (Magnifier follows focus to it). Press **J**, then a number, or use the arrow keys, until the place reads Chattogram (the lens shows the place name under the value). Expected: the lens stays next to the needle, its value is in very large text with its unit, the needle's band is marked on the lens's scale, and the inset shows where you are on the whole map. The value next to the map says the same number.
3. **Compare two places.** Note the value at Chattogram, then move to Dhaka's nearest sea cell (or the Bay of Bengal) and note that value. Expected: you never need to zoom out to know where you are (the inset), and the value, its scale and its place stay together in the lens.
4. **Change the colour scheme.** Press the sliders button next to "Low vision" (top left). In "The map", choose **Colour-blind safe**, then **Two-tone high contrast**, then **NASA's colours**. Expected: the panel opens under the header (not over the whole screen); each scheme redraws the map in sharp bands with the ranges written on them and a matching legend; "Re-coloured by Bloop from decoded values" shows for each re-coloured scheme; **Show NASA's original colours** puts NASA's picture back in one press.
5. Press **]** three times and **[** three times on the map. Expected: the lens grows to about half the screen and back; it never covers the needle.
6. Check that Magnifier follows the needle when you move it with the arrows (it follows focus, which stays on the map) and that the value stays near the map at 400%.
7. **Put the lens where you want it.** In Low-vision settings → The lens, choose each "Lens position": the four corners of the screen, then **In the page, under the map**. Expected: in a corner it stays there while you move the needle (the bottom corners sit above the sound bar); docked, it sits between the map and the legend and scrolls with the page.
8. **No pop-ups.** With low-vision mode on, press **How we got this** next to the value, then **About** in the sound bar, then **H** on the map. Expected: each opens in the page right next to what opened it, its heading is where Magnifier lands, nothing covers the screen, and **Esc** (or Close) shuts it and puts you back on the button you pressed.
9. **Text size 300%.** In Low-vision settings → Text and controls, choose 300%. Expected: the needle's map scrolls back into view; the sound bar no longer sticks to the bottom of the screen (it sits at the end of the page) so it never covers what you are reading.

Then repeat tasks 2 and 4 in **Chrome at 400% page zoom** (Ctrl + Plus five times) without Magnifier. Expected: one column, no sideways scrolling, the value under the map.

## 2. Low-vision user check (at the YPSA session)

Ask whether any participant has **low vision (not blind)** and uses a magnifier or large text. With their consent:

1. Let them use **their usual magnifier and settings** (no Bloop low-vision mode) for the three tasks in section 1 (value at Chattogram, compare two places, change the colour scheme). Note the time, whether each answer was right, and their comments.
2. Turn on **Bloop's low-vision mode** (Alt+L) and repeat the same three tasks. Note the same things.
3. **Choose a Bangla font.** In Low-vision settings → Text and controls, switch Bangla font between **Bloop's Bangla font**, **Noto Sans Bengali** and **Hind Siliguri**, with the app in বাংলা and text size at 200%. Ask which is easiest to read and why. Record the choice; the team sets it as the low-vision default afterwards.
4. Ask whether anything was hard to find, too small, or moved when they didn't expect it.

Don't claim "validated with low-vision users" until this has happened and is written up.

## 3. Sketch test (descriptions)

1. One teammate opens Listen, puts the needle on the Bay of Bengal, sets Detail to **Standard** (Settings → Accessibility) and presses **D**. They read the description aloud, once, at a normal pace. With "Detailed", they also read "What this means".
2. A second teammate, who has not seen the map, listens and sketches the map: where it is warmest or wettest, where the land is, where the needle is.
3. Compare the sketch with the map. Note what was right, what was missing, and which sentence caused any mistake. Repeat with the Rain track.

## 4. The listening test page

`/listen-test` already holds the listener tasks. The accessibility core adds three tasks there when the team next edits it (not done in this build): describe-here (press D, then answer where it is warmest), compare two dates (Compare at Dhaka, then say which year was warmer and by how much), and, if touch mode is built later, touch mode.

## 5. Screen readers by hand (optional, after the automated NVDA run)

The automated NVDA run (RESULTS.md) covers spoken-once, the status region with the 3D hidden, D, and Track 0. By hand, with NVDA (or JAWS) and a braille display if one is available:

1. Listen, map focused (NVDA switches to focus mode): arrows, **+ / −**, **J** then **1–9**, **.**, **PageUp / PageDown**, **N**, **Shift+P**, **Z**. Each should be said once, never twice.
2. With speech mode set to **Bloop's voice**, the screen reader should say nothing for map steps (Bloop speaks instead). Switch back to **My screen reader**.
3. Open a transcript (Description tab → "Transcript: Ocean temperature"). Use H / 2 to move between its sections.

## Kept for a later build (not built now)

- **TalkBack + Bangla** on an Android phone: core tasks 1–3, touch mode with TalkBack on and off.
- **Android vibration:** count the ticks crossing 5 cells; feel the double tick at the coast; feel the long tick at the maximum.
- **iPhone:** the "Vibration isn't available on this device" message appears; nothing breaks.
- **Android magnification** on a phone, with the three low-vision tasks.
