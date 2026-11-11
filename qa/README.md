# QA: browser and screen-reader tests

Kept apart from the app: not in its build, lint or type-check (`qa/tsconfig.json` checks these files).

| Suite | Proves |
|---|---|
| `e2e/a11y` | Every page passes axe; keyboard, speech, descriptions, table, timed text, low vision |
| `e2e/integration/pitch-identity-all` | Every record at every dial stop keeps its value → pitch (within 1 cent) |
| `e2e/health-records` | Every record opens, plays and is labelled as its manifest (run by `npm run health`) |
| `e2e/features`, `e2e/mentor` | Each feature works in the running app |
| `e2e/cv`, `e2e/art`, `e2e/data` | The chord, the dial and orchestra, the data records; loudness and Check 5 |
| `e2e/braille*`, `braille/louis_check.py` | Braille lines and how NVDA's liblouis translates them |
| `nvda/run.ts` (+ `nvda/scripts/keys.ps1`) | NVDA with real keystrokes in Chromium and Firefox (Windows, by hand) |

Run (serve a build first: `bun run build`, then `python pipeline/health/static_server.py out 3700`, and set
`BLOOP_URL=http://localhost:3700`; without it the dev server starts):

- `bun run test:smoke`: the quick Chromium subset (what CI runs).
- `bun run test:e2e`: every suite, Chromium and Firefox. On a small machine: `--workers=1`, one folder at a time.
- `bun run test:e2e qa/e2e/a11y --project=chromium`: one suite, one browser.
