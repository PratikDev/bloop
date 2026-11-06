# Offline Support: Plan

For Team PTSD, mainly L3 (who builds it), with the parts L1 and L2 need to agree to. It explains what "offline" should mean for the Jukebox, how to build it on this repo's Next.js 16.3, the steps in order, how to test it, and the risks.

**Status (28 Sep):** not built. The app has no service worker and no web app manifest, so without a connection it doesn't load at all, and the time-lapse, Then vs Now and Place History fail if the connection drops before they're opened.

---

## 1. Summary

| | |
|---|---|
| **Goal** | After one visit online, the app opens and works with no connection: sound, every mode, every panel. |
| **How** | A small service worker written for this app (no new packages), a web app manifest so it can be installed, a "Save for offline" button, and an offline notice that keeps the frame time honest. |
| **Size saved on the device** | About 8.5 MB automatically (app plus today's frames), about 19 MB with the storm time-lapse. |
| **Effort** | About one working day for L3 (6 to 8 hours), including tests on a laptop and an Android phone. |
| **Needs from others** | L2: agree two `package.json` scripts (L2 owns the scripts). L1: nothing required; an optional file list (§10) makes updates simpler. |
| **Decision needed** | Build it before the freeze (Tue 29, 12:00) or right after. Section 11 covers the trade-off. |

---

## 2. What "offline" means for us (definition of done)

After **one online visit where the user pressed Start** (or pressed **Save for offline**):

1. With the network off (airplane mode, or Wi-Fi off), opening the app's URL loads the app. This includes a full page reload, not just staying on an open tab.
2. **Start listening** works, and so do the opening, Explore with sound (ocean, rain, snow), the sweep, the legend, speech and the satellite whisper.
3. **Then vs Now, Place History (including dragging along the chart), Story Mode**, and the **Truth, Mapping and Provenance** panels work.
4. **The storm time-lapse** works if it was played once online, or saved with **Save for offline**. Otherwise its button says it needs a connection.
5. **Captions, Describe mode, reduced motion and English / বাংলা** work (they need no network).
6. **Honesty (plan §16) holds:** the frame's date and time stay on screen as they are now, and a visible, announced notice says the app is offline and which saved frame it's showing. An old frame is never presented as today's.
7. The data never mixes two days: the ocean grid, rain grid, phase grid, images and their JSON always come from the same pipeline run.
8. Back online, the next visit picks up the newer frame automatically, and an open tab offers "Newer frame ready: reload".
9. Nothing changes for a browser without service workers (for example Firefox private windows): the app works online as it does today.

Not in scope: `/dev/audio` (L2's test page, hidden in production) and `public/data/global/` (13 MB, not used by the app yet).

---

## 3. Everything the app loads

From `src/lib/data/paths.ts`, the fetches in `src/lib/data/` and `src/lib/audio/clips.ts`, and `bun run build` (28 Sep). `public/mapping.json` is compiled into the JavaScript bundle and the fonts are self-hosted by `next/font`, so neither needs its own handling.

| Group | Files | Size | When the app loads it | How often it changes | Strategy (§5.2) |
|---|---|---|---|---|---|
| **App shell** | `/` (the HTML), `/_next/static/**` (JavaScript, CSS, fonts), `/favicon.ico` | about 1 MB | Page load; `ThenNow` and `HistoryPanel` chunks load when first opened | Each deploy (JS and CSS filenames are hashed) | HTML: network first, falling back to the saved copy. Hashed files: saved copy first. |
| **Today's frames** (`/data/latest/`) | `sst.json`, `sst.bin`, `sst.webp`, `rain.json`, `rain.bin`, `rain_phase.bin` (name from `rain.json` → `grid.phase_file`), `rain.png` | 6.7 MB | Ocean at page load; rain after Start | Daily, **same file names** | Saved as one set, keyed by frame time (§5.3) |
| **Context records** | `context/gistemp_bd.json`, `gpcp_bd.json`, `gpcc_bd.json`, `grace.json`; `demo/dhaka_then_now.json` | 0.5 MB | Then vs Now and Place History, when opened | Rarely | Saved copy first, refreshed in the background |
| **Truth plots** | `truth/rain_compare.png`, `sst_compare.png`, `crosscheck.png` | 0.2 MB | Truth panel | Rarely | Same as context |
| **Storm time-lapse** (`/data/sequence/`) | `index.json`, then per frame `rain_NNN.u8.gz` and `rain_NNN.png` (48 each) | 10 MB | First "Play storm time-lapse" | When L1 reruns the sequence | Saved as one set, keyed by `index.json` → `generated_utc` |
| **Narration** (when L4's clips arrive) | `/audio/narration_en/*.mp3`, `/audio/narration_bn/*.mp3` | unknown | `preloadClips()` at start-up | Rarely | Saved copy first |
| Not cached | `/dev/audio`, `/data/global/**`, `context/` files the app doesn't read (`ensemble_bd`, `firms`, `globe_*`, `ndvi`) | — | — | — | Network only |

**Speech works offline already, mostly.** L2's voice picker (`src/lib/audio/voice-pick.ts`) prefers voices marked `localService` (installed on the device). Chrome's "Google …" voices need the internet; the picker skips them when a local voice exists. The only gap: a device with no local voice for the language. The app already handles that by showing the value without speaking it.

---

## 4. Options

### Why Next.js's own offline feature isn't enough

Next 16.3 has an experimental `useOffline` hook and `experimental.useOffline` flag (`node_modules/next/dist/docs/01-app/02-guides/offline-support.md`). It retries **page navigations and Server Actions** when the connection returns. The Jukebox is one page that fetches its data with plain `fetch()`, and the guide itself says: *"A full page reload while offline still fails … full offline loads would need a service worker."* So we need a service worker either way.

### Option A: Serwist (the library the Next.js PWA guide suggests)

Serwist's Turbopack example (Next 16) uses `@serwist/turbopack`, `serwist@preview` and `esbuild`: `withSerwist()` in `next.config`, a route handler `app/serwist/[path]/route.ts` that builds `app/sw.ts`, and `<SerwistProvider swUrl="/serwist/sw.js">` in the layout. Its big advantage is an automatic list of every build file to save ahead of time.

- **Against it now:** its Turbopack support needs Serwist's **preview** (pre-release) channel, adds three packages and a build step the day before the freeze, and its default caching rules don't know about our "same file names, new data daily" set (§5.3). We would still write that part ourselves.

### Option B: our own service worker (recommended)

About 250 lines of TypeScript in `src/sw/`, bundled by Bun into `public/sw.js`. No new packages.

- The one thing Serwist does that we must replace: knowing the hashed file names of the build. For a one-page app that's simple: on the first visit, the page sends the service worker the list of files it actually loaded (from `performance.getEntriesByType("resource")`), and the service worker saves them (§5.4). After that, every file the app requests is saved as it passes through.
- It fits the rules in `AGENTS.md`: typed, small files, one place per concern.

**Recommendation: Option B now; revisit Serwist after the freeze** if we need precaching of routes we haven't visited (for example if the app grows more pages).

---

## 5. Design

### 5.1 The pieces

```
Browser page (React)                        Service worker (public/sw.js, built from src/sw/)
┌──────────────────────────────┐   messages   ┌────────────────────────────────────────────┐
│ register the worker           │ ───────────▶ │ fetch handler: routes each request to a      │
│ send "files I loaded"         │              │   strategy by URL (table in §3)              │
│ "Save for offline" button     │ ◀─────────── │ caches:                                      │
│ offline notice                │   progress,  │   jukebox-shell-<build>                      │
│ "Newer frame ready" prompt    │   saved,     │   jukebox-latest-<frame times>               │
└──────────────────────────────┘   updated    │   jukebox-sequence-<generated_utc>           │
                                               │   jukebox-context, jukebox-audio             │
                                               └────────────────────────────────────────────┘
```

### 5.2 Caching strategy per group

| Request | Strategy | Why |
|---|---|---|
| Page navigation to `/` | **Network first, 3 s timeout**, then the saved `/`; save each good response | Online users get the newest deploy; offline users get the saved page. |
| `/_next/static/**` | **Saved copy first**; save on first fetch | File names change with every deploy, so a saved file is never out of date. |
| `/data/latest/**` | **From the current saved set** (§5.3); network only if no complete set exists yet | Never mixes days. |
| `/data/sequence/**` | From the saved sequence set; otherwise network, and add to the set being built | Ten megabytes; saved when first played or on Save for offline. |
| `/data/context/**`, `/data/demo/**`, `/data/truth/**`, `/audio/**` | **Saved copy first, then refresh in the background** | Rarely changes; fast and offline-safe. |
| Anything else | Network only | Keeps storage small; `/dev/audio` and `/data/global/**` stay online-only. |

### 5.3 Today's frames: saved as one set

The pipeline overwrites `/data/latest/*` in place every day. If the service worker refreshed files one by one, a user could get today's `rain.json` with yesterday's `rain.bin`: the numbers would decode without errors and be **wrong**, which breaks the honesty rules. So `latest/` is handled as a set:

1. **The key is the two frame times:** `sst.json → frame_time_utc` and `rain.json → frame_time_utc`. The cache is named `jukebox-latest-<sst time>_<rain time>`.
2. **Syncing a set** (in the service worker): fetch both JSON files, read `grid.phase_file` from `rain.json`, fetch the other five files **with `cache: "no-store"`**, and only when **all seven** succeeded, write them to a new cache under the new key. Then delete older `jukebox-latest-*` caches. If any file fails, keep the old set untouched.
3. **When it runs:** when the worker activates, and when a page says "app started" while online, at most once an hour. The first online visit also saves files as they pass through (so the first visit costs no extra download), then checks that the set is complete.
4. **Serving:** requests for `/data/latest/*` are answered from the current complete set. With no complete set yet (the very first visit), they go to the network.
5. **Newer data:** if a sync saves a set with newer frame times than the one the open page is using, the worker tells the page, and the page shows **"Newer frame ready: Reload"** (visible, and announced once in the live region). The page never swaps grids under the user mid-session.

The storm time-lapse works the same way with `jukebox-sequence-<generated_utc>`: `index.json` names all 96 files, and the set counts as saved only when all of them are in.

### 5.4 Saving the app itself on the first visit

A service worker only controls pages loaded **after** it's installed, so the first visit's files went past it. To save them anyway:

1. When the worker **installs**, it saves `/` straight away.
2. When the page registers the worker and it's ready, the page sends `{ type: "cache-loaded", urls }`, where `urls` is every same-origin file in `performance.getEntriesByType("resource")` whose path starts with `/_next/` or is `/favicon.ico`. The worker fetches and saves any it doesn't have.
3. `clients.claim()` on activate, so the first page is controlled from then on; every later request is saved as it passes (§5.2).

The chunks for Then vs Now and Place History load only when opened. **Save for offline** (§5.6) opens nothing but fetches them anyway: the page asks the worker to save the page's lazy chunks by pulling them in with `import()` once, so they pass through the worker.

### 5.5 New app versions

- `public/sw.js` embeds the build ID (`src/sw/version.ts`, written at build time), so each deploy produces a new worker.
- `skipWaiting()` plus `clients.claim()`: the new worker takes over at once.
- **Keep the previous shell cache for one version.** A tab still running the old version may load an old lazy chunk later; deleting the old cache at once would break that tab while offline. `activate` deletes shell caches older than the previous one.
- `next.config.ts` serves `/sw.js` with `Cache-Control: no-cache, no-store, must-revalidate`, so browsers always check for a new worker (as in the Next.js PWA guide, §8 there).

### 5.6 What the user sees

1. **Offline notice** (top bar, next to the language switch): a `StatusBadge` with a new `offline` shape, reading **"Offline · frame saved 27 Sept 2026"**. It uses the same frame times the frame label already shows, and is announced once when the connection drops or returns.
   - Online state comes from a `useOnline()` hook: `navigator.onLine` plus the `online` and `offline` events, through `useSyncExternalStore` (like `src/hooks/use-media-query.ts`). We don't need Next's experimental `useOffline` flag.
2. **Save for offline** (in Settings, and in Help on phones): **"Save for offline (about 19 MB)"**. It shows progress ("Saving… 42%"), then **"Saved for offline: frame of 27 Sept 2026, 02:30 UTC"**. It saves today's set, the context records, the truth plots, the lazy chunks, the storm time-lapse and the narration clips. It also calls `navigator.storage.persist()`, so the browser is less likely to clear the saved files when space runs low.
3. **Automatic saving without the button:** after Start, today's set and the shell are saved (about 8.5 MB, mostly downloaded anyway). The time-lapse is saved the first time it's played.
4. **Time-lapse offline and not saved:** its button reads **"Time-lapse needs a connection"** and is disabled, instead of trying and failing.
5. **"Newer frame ready: Reload"** (§5.3).
6. All new strings go through the i18n table (`src/lib/i18n/en/app.ts`) and into `docs/L3/bangla-strings.md`: about 8 strings.

### 5.7 Installing the app (manifest)

`src/app/manifest.ts` (a Next.js metadata file; see `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`):

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Earth Information Jukebox",
    short_name: "Jukebox",
    description: "Hear NASA's view of today's ocean and rain as live sound.",
    start_url: "/",
    display: "standalone",
    background_color: "#15122a", // --night
    theme_color: "#15122a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

- Icons are needed (192, 512, and a maskable 512). There are none yet; make them from the README banner's ring motif (pink rings on night indigo).
- Installing isn't required for offline use, but on **iPhone** it matters: Safari may clear a site's saved data after about 7 days without a visit, and installed apps are treated better. It's also the natural route to the October kiosk / hyperwall mode (plan §11.7).

---

## 6. Files to add and change

| File | Change | Owner |
|---|---|---|
| `src/sw/index.ts` | The worker: `install`, `activate`, `fetch` routing, `message` handling | L3 |
| `src/sw/routes.ts` | URL → strategy table (§5.2), one place | L3 |
| `src/sw/strategies.ts` | `networkFirst`, `cacheFirst`, `staleWhileRevalidate` | L3 |
| `src/sw/latest-set.ts` | Sync and serve today's set (§5.3) | L3 |
| `src/sw/sequence-set.ts` | The time-lapse set | L3 |
| `src/sw/version.ts` | Build ID, written at build time | L3 |
| `tsconfig.sw.json` | Separate TypeScript settings for the worker (`lib: ["ES2022", "WebWorker"]`); the main `tsconfig.json` excludes `src/sw` so the DOM and worker types don't clash | L3 |
| `src/lib/offline/messages.ts` | The message types shared by the page and the worker (one copy) | L3 |
| `src/lib/offline/register.ts` | Registers `/sw.js` in production only, sends "cache-loaded" and "app-started" | L3 |
| `src/hooks/use-online.ts` | Online / offline state | L3 |
| `src/components/Offline/` | `OfflineProvider` (index.tsx), `OfflineBadge.tsx`, `SaveOfflineButton.tsx`, `NewerFrameToast.tsx`, `use-offline-status.ts` | L3 |
| `src/components/StatusBadge.tsx` | New `offline` kind (shape plus words, never colour alone) | L3 |
| `src/components/TimeLapse/TimeLapseButton.tsx` | "Needs a connection" state | L3 |
| `src/app/manifest.ts`, `public/icons/*` | Manifest and icons | L3 |
| `src/app/layout.tsx` | Mount `OfflineProvider`; `appleWebApp` metadata | L3 |
| `next.config.ts` | `headers()` for `/sw.js` (§5.5) | L3 |
| `package.json` | `"build:sw": "bun build src/sw/index.ts --outfile public/sw.js --target browser --minify"`; `"build"` runs it before `next build`; a `typecheck:sw` step | **L2 owns scripts: agree first** (contract-proposals §B4) |
| `.gitignore` | `public/sw.js` (generated) | L3 |
| `src/lib/i18n/en/app.ts`, `docs/L3/bangla-strings.md` | About 8 new strings | L3 |
| `README.md` | An "Works offline" line and how to save | L3 |

---

## 7. Key code, in outline

These are shapes to follow, not final code.

**Routing (src/sw/routes.ts)**

```ts
export type Strategy = "shell-page" | "static" | "latest" | "sequence" | "revalidate" | "network";

const RULES: readonly [test: (path: string) => boolean, strategy: Strategy][] = [
  [(p) => p === "/", "shell-page"],
  [(p) => p.startsWith("/_next/static/") || p === "/favicon.ico" || p.startsWith("/icons/"), "static"],
  [(p) => p.startsWith("/data/latest/"), "latest"],
  [(p) => p.startsWith("/data/sequence/"), "sequence"],
  [(p) => /^\/data\/(context|demo|truth)\//.test(p) || p.startsWith("/audio/"), "revalidate"],
];

export function strategyFor(url: URL, origin: string): Strategy {
  if (url.origin !== origin) return "network";
  return RULES.find(([test]) => test(url.pathname))?.[1] ?? "network";
}
```

**Messages (src/lib/offline/messages.ts), used by both sides**

```ts
export type ToWorker =
  | { type: "cache-loaded"; urls: string[] }
  | { type: "app-started" }
  | { type: "save-all" };

export type FromWorker =
  | { type: "save-progress"; done: number; total: number }
  | { type: "saved"; frames: { sst: string; rain: string }; sequence: boolean }
  | { type: "newer-frame"; frames: { sst: string; rain: string } }
  | { type: "save-failed" };
```

**Syncing today's set (src/sw/latest-set.ts)**

```ts
const PREFIX = "jukebox-latest-";

export async function syncLatest(): Promise<string | null> {
  const [sst, rain] = await Promise.all([getJson("/data/latest/sst.json"), getJson("/data/latest/rain.json")]);
  const key = `${PREFIX}${sst.frame_time_utc}_${rain.frame_time_utc}`;
  if (await caches.has(key)) return key; // already saved
  const files = ["sst.json", "sst.bin", "sst.webp", "rain.json", "rain.bin", "rain.png", rain.grid.phase_file];
  const responses = await Promise.all(files.map((f) => fetch(`/data/latest/${f}`, { cache: "no-store" })));
  if (!responses.every((r) => r.ok)) return null; // keep the old set
  const cache = await caches.open(key);
  await Promise.all(responses.map((r, i) => cache.put(`/data/latest/${files[i]}`, r)));
  await deleteOlder(PREFIX, key);
  return key;
}
```

**Online state (src/hooks/use-online.ts)**

```ts
export function useOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("online", onChange);
      window.addEventListener("offline", onChange);
      return () => {
        window.removeEventListener("online", onChange);
        window.removeEventListener("offline", onChange);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}
```

`navigator.onLine` can say "online" on Wi-Fi with no internet. The badge therefore also turns on when a data request fails and the worker answers from its saved copy: the worker marks those responses with an `X-Jukebox-Offline: 1` header, and the page's data layer (`src/lib/data/fetch.ts`) reports it.

---

## 8. Steps, in order

Each step ends with `bunx tsc --noEmit`, `bun run lint` and a check in the browser.

1. **Agree the scripts with L2** (§6, `package.json`). Until then, run `bun build …` by hand.
2. **Worker skeleton:** `src/sw/` with `install`, `activate` (claim, clean old caches), and a `fetch` handler that only passes requests through. Register it in production only. *Check:* DevTools → Application → Service workers shows it "activated and running".
3. **Shell:** network-first `/`, saved-first `/_next/static/**`, and the "cache-loaded" message. *Check:* after one visit, Network → Offline → reload: the page and the Start screen appear.
4. **Today's set** (§5.3). *Check:* offline reload, press Start: ocean and rain sound, and the readout matches the online values at the same points.
5. **Context, truth, narration:** saved first, refreshed in the background. *Check:* offline: Then vs Now, Place History (drag too), and the Truth panel work.
6. **Time-lapse set.** *Check:* play once online, then offline reload: it plays. Never played: the button says it needs a connection.
7. **UI:** offline badge, Save for offline, "Newer frame ready", strings in both files. *Check:* keyboard and screen reader reach every new control; announcements happen once.
8. **Manifest and icons.** *Check:* Chrome shows "Install app"; the installed app opens full screen and works offline.
9. **Headers** for `/sw.js` in `next.config.ts`. *Check:* a new deploy replaces the worker on the next visit.
10. **Docs:** README line; `docs/L3/PROGRESS.md` feature row; `docs/REMAINING.md`.

---

## 9. How to test

Test with `bun run build` then `bun run start` (the Next.js guide warns that dev mode isn't a reliable reference for offline behaviour). The worker isn't registered in development at all.

**Desktop (Chrome or Edge)**
- DevTools → Application → Service workers: registered and activated. Cache storage: `jukebox-shell-*`, `jukebox-latest-*`, `jukebox-context`.
- Network → **Offline**, then reload: the Start screen appears; Start works with sound; every mode and panel works (§2).
- Save for offline, then offline: the time-lapse plays.
- **Data never mixes:** online, change `frame_time_utc` in a local copy of `public/data/latest/sst.json` and restart the server. The open tab offers "Newer frame ready"; after reload, the frame label shows the new time. Now make one file fail to download (rename `rain.png`): the old set stays in use, complete.
- **New deploy:** rebuild with a small visible change; reload once: the new version runs; an old tab left open still works offline.

**Phones**
- **Android, Chrome:** visit, press Start, airplane mode on, close Chrome fully, open the app again. Install it and repeat from the home-screen icon.
- **iPhone, Safari:** the same. Also installed to the home screen. Note: iOS may clear saved data after about 7 days without a visit.
- **Firefox:** the same on desktop. In a private window, the app must still work online (no worker).

**Automated (headless Edge, scripts outside the repo like the others in `C:\Users\User\nasa-l3-qa`)**
- Visit and press Start, then `context.setOffline(true)` and reload: the Start screen appears, Start works, the analyser shows sound, the frame label shows the saved frame time, the offline badge is visible, and there are no console errors.
- The same for the time-lapse after Save for offline.

**Accessibility**
- The offline badge, Save for offline and "Newer frame ready" work with the keyboard and NVDA; each change is announced once, never repeatedly.

---

## 10. What L1 and L2 need to know

- **L2:** the two `package.json` scripts (§6). Nothing changes in `src/lib/audio/`. `preloadClips()` already fetches the narration files, so they'll be saved as they pass through the worker. L2's local-voice preference already covers speech.
- **L1:** nothing is required. Optional, but it makes the set sync simpler and safer: a small `public/data/latest/manifest.json` written last by the pipeline, listing the seven files with their sizes (or hashes) and the two frame times. The worker would then read one file to know the whole set. Also keep writing `index.json` last for `sequence/`.
- **Everyone:** if the pipeline ever renames files in `latest/`, tell L3: the file list lives in `src/sw/latest-set.ts` (or in L1's manifest, if added).

---

## 11. Risks, and when to build it

| Risk | Effect | What reduces it |
|---|---|---|
| A bug in the worker serves old app files | Users stuck on an old version | Network-first HTML; `no-cache` header on `/sw.js`; build ID in the worker; a "kill switch": deploying a `sw.js` that unregisters itself |
| Days mixed in the data | Wrong values, silently | The all-or-nothing set (§5.3) |
| The browser clears saved data | Offline stops working after some time | `navigator.storage.persist()`; installing the app; "Saved for offline: <date>" shows the state |
| Offline on the first visit | Nothing can load | Can't be avoided; the README and Help say "open it once online, then Save for offline" |
| A service worker caching `/` during development | Confusing stale pages | Registered in production builds only |
| Storage quota (about 19 MB) | Save fails on a nearly full phone | Save reports failure and keeps the old set; the automatic part is only 8.5 MB |
| Built in a rush before the freeze | Could break the demo | Everything sits behind registration; to back out, deploy the unregister-only worker |

**Before or after the freeze?** The freeze is **Tue 29, 12:00**, and the listening, screen-reader and device tests (docs/REMAINING.md §2) haven't happened yet. The build is a day of work.

- **If offline must be in Video 1**, start now and build it in the step order above. Steps 2 to 5 (about 4 hours) already give a working offline app. Leave the manifest (step 8) until after the freeze if time runs short.
- **If it's a must for the product but not for the video**, build it straight after the freeze, before the October mentoring starts, where it also serves the kiosk / hyperwall mode (plan §11.7). For recording, a local production build (`bun run build`, `bun run start`) already works with no internet.
