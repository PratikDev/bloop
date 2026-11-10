# Session A: status

- layout rebuild: one screen per page, maps at least their baseline size, Home's jukebox around the globe | 43d3a43, 397751e, d16c217, 96a4e1d | 2026-11-10
- Then vs Now and How we know briefs, header language and Help on every page, Home window border outside | a799dca | 2026-11-10 | next: audit items A1–A11, A-bn

## Home window, for Session B's check

- **Component:** `src/components/JukeboxArt/Frame.tsx`, `JukeboxFrame`. Home (`src/components/pages/Home/index.tsx`) passes `window` (your `Globe` inside `SpaceWindow`, with `onViewChange={setFacing}`), `tube` (`<DataTube facing={facing} paused={pause.paused} />`, the left amber tube) and `footer` (the frame caption and Pause motion, on the coin plate's row under the window).
- **Size:** the window's inside (the globe's canvas) is `--jf-window`, set on `.jukebox-home` in `src/app/globals.css`; `.jukebox-window` is `box-sizing: content-box`, so its 3 px border sits outside that size (no border below 1024 px):
  - below 1024 px: `100vw` (full width; your renderer keeps the 16 px clear inside);
  - from 1024 px: `min(36rem, 100dvh - 13rem, 100vw - 15.875rem - 24rem)`;
  - from 1280 px: `min(36rem, 100dvh - 13rem, 100vw - 15.875rem - 32rem)`.
- **Measured** (Home canvas, CSS px, Chromium, :3101, commit a799dca):

  | Viewport | Window (inside) | Border | Baseline (592003b) |
  |---|---|---|---|
  | 1920×1080 | 576 | 3 | 544 |
  | 1536×730 | 522 | 3 | (not in the baseline set) |
  | 1440×900 | 576 | 3 | 544 |
  | 1280×720 | 512 | 3 | 480 |
  | 1024×768 | 386 | 3 | 288 |
  | 390×844 | 390 | 0 | 358 |

- **Position:** the right column of Home, centred; the coral arch rises behind the window's top edge with the marquee above it, the amber (left, live) and dial-blue (right) tubes beside it from 1024 px (below it, side by side, on phones), the coin plate and footer under it.
- No page scroll on Home at 1920×1080, 1536×730, 1440×900, 1280×720 and 1024×768 (`document` and `main` both 0).

## Then vs Now, for Session B

- The globe column beside the chart is `13rem` from 1024 px and `15rem` from 1280 px (`src/components/ThenNow/Layout.tsx`); on phones the stage is `aspect-5/6`, `max-w-56`, for your corner Pause key.
- `src/components/charts/YearlyChart.tsx` (it imports your `PanelStripes`, `PanelPlayhead`, `PanelYear`; none of them changed): the year labels are paper with a navy outline (no longer `comic-box`), the unit is a line of text above each plot (no rotated y-axis label), the legend adds the stripe colours (amber at or above `yearlyBaseline`, blue below) and the plot height is `PANEL_CHART_HEIGHT` = `h-48 lg:h-(--tn-panel)`, which grows with the screen (192 px at 1280×720, 372 at 1440×900, 552 at 1920×1080). Your stripes and playhead follow the plot through `PANEL_PLOT_INSET`, which didn't change.
