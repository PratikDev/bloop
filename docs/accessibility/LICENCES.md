# Licences: accessibility work

Every dependency the braille work added, checked on 3 Nov 2026. Nothing new ships in the app bundle: both packages are development tools only.

| Dependency | Version | Licence | Where it is used | Ships to users? | Obligation |
|---|---|---|---|---|---|

## Accessibility core, step 8 (low-vision mode), checked on 9 Nov 2026

Three fonts, served through `next/font/google` (self-hosted at build time, no request to Google from the visitor's browser). None is preloaded: each downloads only when its setting puts it on screen.

| Font | Licence | Where it is used | Ships to users? | Obligation |
|---|---|---|---|---|
| Atkinson Hyperlegible (Braille Institute of America) | SIL Open Font License 1.1 | Low-vision settings → Font (Latin text) | Yes (font files, on demand) | Keep the OFL notice with the font if the files are redistributed on their own; the font can't be sold by itself. Bundling in a site is allowed. |
| Noto Sans Bengali (Google) | SIL Open Font License 1.1 | Low-vision settings → Bangla font (candidate 1) | Yes (on demand) | As above. |
| Hind Siliguri (Indian Type Foundry) | SIL Open Font License 1.1 | Low-vision settings → Bangla font (candidate 2) | Yes (on demand) | As above. |

The cividis colour scale (Nuñez, Anderton & Renslow 2018, PLOS ONE) is a list of ten published colour values typed into `globals.css`; no code is used.

## Considered and not used

| Item | Licence | Decision |
|---|---|---|
| MAIDR (Seo et al., CHI 2024) | GPL-3.0 | **Ideas only, no code.** We reuse its braille encoding (published in the paper) and its interaction ideas, written from scratch in `src/a11y/brailleShape.ts`. GPL code must not enter the shipped bundle. |
| liblouis (via a WebAssembly build such as `liblouis-build`) | LGPL-2.1-or-later (library), tables under various licences | **Not added.** It was optional (B6: translate the value line in the preview). The shape line is already Unicode braille and needs no translation. If it is added later, load it as a separate, replaceable asset only when the preview is on, and ship its licence and source offer. Ask the team before adding it, because LGPL is copyleft for the library itself. |
| NVDA, JAWS, VoiceOver, TalkBack | various (NVDA: GPL-2.0) | Test tools only, never bundled. |
