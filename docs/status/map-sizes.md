# Map, globe and chart sizes

Rendered size in CSS px. Every one must stay at least as large as its baseline at each viewport.

- **Baseline:** commit `592003b`, the last commit before phase 3, served on port 3103, Chromium.
- **Measured now:** phase 7 work on top of `2ca5942` (`session-a`, commit `4303bde`), served on port 3101, Chromium. Phase 3 was already on `final-pass` when this rule arrived, so the baseline is taken from the commit before it.

| Item | Viewport | Baseline | Now | Status |
|---|---|---|---|---|
| Listen map | 1920x1080 | 1632×816 | 1216×608 | **smaller** |
| Listen map | 1440x900 | 1208×604 | 856×428 | **smaller** |
| Listen map | 1280x720 | 992×496 | 544×272 | **smaller** |
| Listen map | 1024x768 | 888×444 | 498×249 | **smaller** |
| Listen map | 390x844 | 390×195 | 338×169 | **smaller** |
| Home globe | 1920x1080 | 544×544 | 187×187 | **smaller** |
| Home globe | 1440x900 | 544×544 | 187×187 | **smaller** |
| Home globe | 1280x720 | 480×480 | 163×163 | **smaller** |
| Home globe | 1024x768 | 288×288 | 120×120 | **smaller** |
| Home globe | 390x844 | 358×358 | 150×150 | **smaller** |
| Then vs Now chart (each panel) | 1920x1080 | 404×192 | 404×192 | ok |
| Then vs Now chart (each panel) | 1440x900 | 404×192 | 404×192 | ok |
| Then vs Now chart (each panel) | 1280x720 | 408×160 | 384×160 | **smaller** |
| Then vs Now chart (each panel) | 1024x768 | 280×160 | 277×160 | **smaller** |
| Then vs Now chart (each panel) | 390x844 | 300×192 | 306×192 | ok |
| Official records map | 1920x1080 | 1480×740 | 422×211 | **smaller** |
| Official records map | 1440x900 | 1000×500 | 830×415 | **smaller** |
| Official records map | 1280x720 | 840×420 | 870×435 (`fixes`, 2026-11-11) | ok |
| Official records map | 1536x730 | 1096×548 (page scrolled) | 1126×563 (`fixes`, 2026-11-11) | ok |
| Official records map | 1024x768 | 584×292 | 574×287 | **smaller** |
| Official records map | 390x844 | 358×179 | 330×165 | **smaller** |
| Turntable canvas | 1920x1080 | 1920×1020 | 1920×1008 | **smaller** |
| Turntable canvas | 1440x900 | 1440×840 | 1440×828 | **smaller** |
| Turntable canvas | 1280x720 | 1280×660 | 1280×648 | **smaller** |
| Turntable canvas | 1024x768 | 1024×708 | 1024×696 | **smaller** |
| Turntable canvas | 390x844 | 390×748 | 390×734 | **smaller** |

The 1536×730 baseline was measured on `592003b` (port 3503, Chromium) for the `fixes` branch; the table above had no row for it. On `fixes` the Official page keeps its cabinet frame at 1536×730 and 1280×720 and does not scroll.
