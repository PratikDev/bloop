# Licences: accessibility work

Every dependency the braille work added, checked on 3 Nov 2026. Nothing new ships in the app bundle: both packages are development tools only.

| Dependency | Version | Licence | Where it is used | Ships to users? | Obligation |
|---|---|---|---|---|---|
| `@playwright/test` (with `playwright`, `playwright-core`) | 1.56.1 | Apache-2.0 | Browser tests (`e2e/*.e2e.ts`, `bun run e2e`) | No (devDependency) | Keep the licence notice if it is ever redistributed. |
| Playwright's Chromium and Firefox builds | Chromium 1194, Firefox 1495 | BSD-3-Clause (Chromium), MPL-2.0 (Firefox) | Test browsers, installed to `D:\Jukebox\tools\ms-playwright` (`PLAYWRIGHT_BROWSERS_PATH`) | No | None for local testing. |
| `axe-core` | 4.13.0 | MPL-2.0 | Injected into the page by the e2e test to check accessibility | No (devDependency, test only) | MPL-2.0 is file-level copyleft. It applies only if we modify and distribute axe-core files, which we don't. |

## Considered and not used

| Item | Licence | Decision |
|---|---|---|
| MAIDR (Seo et al., CHI 2024) | GPL-3.0 | **Ideas only, no code.** We reuse its braille encoding (published in the paper) and its interaction ideas, written from scratch in `src/a11y/brailleShape.ts`. GPL code must not enter the shipped bundle. |
| liblouis (via a WebAssembly build such as `liblouis-build`) | LGPL-2.1-or-later (library), tables under various licences | **Not added.** It was optional (B6: translate the value line in the preview). The shape line is already Unicode braille and needs no translation. If it is added later, load it as a separate, replaceable asset only when the preview is on, and ship its licence and source offer. Ask the team before adding it, because LGPL is copyleft for the library itself. |
| NVDA, JAWS, VoiceOver, TalkBack | various (NVDA: GPL-2.0) | Test tools only, never bundled. |
