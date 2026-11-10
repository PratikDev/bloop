# Audit state (read-only UI/UX/a11y audit of home-fix, plus local final-pass)

Not a build session: no repo files changed, nothing committed. Repo checkout C:\Users\User\bloop is on final-pass, clean.

## Setup
- Scratch copies (git archive, bun install, bun run build): scratchpad/home-fix (home-fix @ b484a9d), scratchpad/final-pass (final-pass @ b80f001)
- Static servers: home-fix on :3217, final-pass on :3218 (python scratchpad/tools/static_server.py <out> <port>)
- Scripts: scratchpad/home-fix/audit/{audit.mjs, audit2.mjs, ring.mjs, announcer.mjs}; PLAYWRIGHT_BROWSERS_PATH=D:\Jukebox\tools\ms-playwright; BLOOP_URL picks the server
- Outputs: audit-out, audit-out2 (home-fix); fp-out, fp-out2 (final-pass); logs *.log in scratchpad

## Done
- home-fix: axe (wcag2a/aa/21/22 + best practice) clean on every route x 6 viewports x 3 states; no sideways scroll; no text <14 px
- Lint clean on both branches. Unit tests: final-pass 221 pass 0 fail in the real checkout (scratch-copy fails were only the missing docs/ folder)
- final-pass layout.e2e.ts (repo's own test): FAILS at 1280x720 and 1024x768: Home "NASA EIC frame: ..." caption overlaps "Pause motion" key (lg:absolute from commit 12014a5). 390x844 passes but the test skips aria-hidden text, so it misses the dock label collision below.

## Findings so far (both = present on home-fix and final-pass)
P0 (final-pass only)
- Zoom: at 200% (640x360) Listen main is 4% of the screen (~25 px); at 400% (320x256) main has zero height on Listen, Then vs Now, How, Official (audit timed out waiting for main). Header + player fill the screen. home-fix at 200% kept ~280 px of map.
P1 (final-pass)
- After Start listening -> intro -> journey, focus ends on the sr-only h1, not the map (JukeboxJourney onEnd moves focus off the map). Arrow keys dead until Tab. home-fix kept focus on the map.
- Help dialog (both): opens focused on "Built-in voice", scrolled past every key table.
- Official page: 19 record strips + 8 related records are each a Tab stop before the map/player (no roving focus).
P1
- both: Next.js route announcer (role=alert, assertive) speaks the PREVIOUS page's title on every header navigation (on How we know it says "Then vs Now · Bloop"). Clashes with focus moving to the new h1.
- both: forced-colours (Windows High Contrast): ChoiceGroup selected option invisible (highlight is a motion span bg). home-fix has no forced-colors CSS at all; final-pass added rules for aria-pressed, need to re-check screenshot fp-out2/forced-*.png
- home-fix: dock caption squeezed to ~60 px at 1280-1440 ("29.8 °C..." two-line clamp), the live caption unreadable
- home-fix: 400% zoom / 320x256: header+dock take 86% of the screen on Listen (main 14%); first hint covers the map; 320x568 dock covers readout
- final-pass: 390 px phone dock labels Braille/Records/Mixer overrun each other; 320x568 Listen main gets 29% of the screen
- final-pass: main sound button is icon-only (size-16 coral disc); home-fix showed the "Turn sound on" text from sm up
- both: ~410 (final-pass) / 434 (home-fix) strings English-only in Bangla (TO_TRANSLATE.md), incl. Turntable, "Braille explorer" in the dock
- home-fix: Help dialog opens with focus on "Built-in voice" toggle mid-dialog, not the title/top; keyboard users skip all key tables
P2
- home-fix: tour start leaves focus on BODY (after Take the tour from the dock)
- both: Mixer volume thumbs 12x12 px visual (range input 10x10), no visible focus on thumb itself (outline on hidden input)
- both: Then vs Now: ChoiceGroup/buttons 36 px tall on desktop (pointer-fine) — fine for 2.5.8 (24) but below 44 the app promises
- both: Official records strips 36 px (home-fix) ; final-pass has 2 targets <24 px on Official (likely inline SVS links 24 px tall in a dd)
- final-pass: Listen h1 is sr-only (sighted low-vision users lose the page name; crown says "Now playing")
- final-pass: compact frame line truncates with ellipsis at 1440 ("...fram...")
- final-pass: PlayerSheet uses literal "(max-width: 1023px)" instead of MEDIA (DRY); Lyrics use text-[1.875rem]/text-[1.1875rem] arbitrary sizes; PauseMotionKey uses lucide icons, rest Phosphor
- final-pass: Turntable sheets open with transparent scrim (globals.css body:has([data-tt-stage]))
- both: no dark theme / prefers-contrast; app forces color-scheme light
- both: FirstHint "Got it" tabIndex -1
- final-pass: FrameProgress aria-label changes every frame
- both: text-spacing override clips the "Listen" eyebrow on Then vs Now (h3 lg:short:sr-only)
P3
- both: button transition-all animates the focus outline in from 0 px (lags under load; ring.mjs proved it does draw)
- both: signal-pulse logo animation loops forever (no pause except reduce motion)

## Positives
- Single debounced polite live region; map is role=application with instructions; arrows announce settled reading; Esc layering; skip links (final-pass adds Skip to map/records/player); Go to form with errors; braille explorer; reduced motion honoured (globe stops); 44 px targets on phones; palette text pairs all >= 5.4:1; Comfortable text + forced-colors CSS + chart data tables in final-pass; native range needle sliders in final-pass

## Next action
1. Read fp-audit2.log (final-pass keyboard/help/flow/forced/motion/spacing/phone) and fp-out screenshots for zoom200/zoom400 and forced-colours.
2. Then write the final report: ratings per branch, findings by severity, fixes.
