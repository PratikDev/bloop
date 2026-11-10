# Session A: status

- layout rebuild: one screen per page, maps at least their baseline size, Home's jukebox around the globe | 43d3a43, 397751e, d16c217, 96a4e1d | 2026-11-10 | next: audit items A1–A11, A-bn

## Home window, for Session B's check

- **Component:** `src/components/JukeboxArt/Frame.tsx`, `JukeboxFrame`. Home (`src/components/pages/Home/index.tsx`) passes `window` (your `Globe` inside `SpaceWindow`, with `onViewChange={setFacing}`), `tube` (`<DataTube facing={facing} paused={pause.paused} />`, the left amber tube) and `footer` (the frame caption and Pause motion, on the coin plate's row under the window).
- **Size:** the window is `--jf-window`, set on `.jukebox-home` in `src/app/globals.css`:
  - below 1024 px: `100vw` (full width; your renderer keeps the 16 px clear inside);
  - from 1024 px: `min(36rem, 100dvh - 13.5rem, 100vw - 15.5rem - 24rem)`;
  - from 1280 px: `min(36rem, 100dvh - 13.5rem, 100vw - 15.5rem - 32rem)`.
- **Measured** (Home canvas, CSS px, Chromium, :3101, commit 96a4e1d):

  | Viewport | Window | Baseline (592003b) |
  |---|---|---|
  | 1920×1080 | 576 | 544 |
  | 1536×730 | 508 | (not in the baseline set) |
  | 1440×900 | 576 | 544 |
  | 1280×720 | 504 | 480 |
  | 1024×768 | 432 | 288 |
  | 390×844 | 390 | 358 |

- **Position:** the right column of Home, centred; the coral arch rises behind the window's top edge with the marquee above it, the amber (left, live) and dial-blue (right) tubes beside it from 1024 px (below it, side by side, on phones), the coin plate and footer under it.
- No page scroll on Home at 1920×1080, 1536×730, 1440×900, 1280×720 and 1024×768 (`document` and `main` both 0).
