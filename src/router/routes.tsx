import { createRootRoute, createRoute, lazyRouteComponent } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { HomePage } from "@/components/pages/Home";
import { NotFoundPage } from "@/components/pages/NotFound";
import { listenSearch, officialSearch, thenNowSearch, transcriptSearch } from "./search";

// Seven places and a 404 (docs/L3/REDESIGN.md §2; Official and Turntable joined from bloop-dev). Then vs Now, How we
// know, Official and Turntable load their code (the chart library, three.js) only when opened.

const rootRoute = createRootRoute({ component: AppShell, notFoundComponent: NotFoundPage });

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: HomePage });

// ── Session B (performance): Listen (and the Braille explorer inside it) loads on demand too; hovering or focusing
// its link starts the download (defaultPreload "intent").
const listenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "listen",
  validateSearch: listenSearch,
  component: lazyRouteComponent(() => import("@/components/pages/Listen"), "ListenPage"),
});
// ── end Session B

const thenNowRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "then-now",
  validateSearch: thenNowSearch,
  component: lazyRouteComponent(() => import("@/components/pages/ThenNowPage"), "ThenNowPage"),
});

const howRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "how",
  component: lazyRouteComponent(() => import("@/components/pages/How"), "HowPage"),
});

const officialRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "official",
  validateSearch: officialSearch,
  component: lazyRouteComponent(() => import("@/components/pages/Official"), "OfficialPage"),
});

const turntableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "turntable",
  component: lazyRouteComponent(() => import("@/components/pages/TurntablePage"), "TurntablePage"),
});

const teamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "team",
  component: lazyRouteComponent(() => import("@/components/pages/Team-v2"), "TeamPage"),
});

// The listener test (mentor item 8): no link to it anywhere, noindex (src/app/[[...path]]/page.tsx).
const listenTestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "listen-test",
  component: lazyRouteComponent(() => import("@/components/pages/ListenTest"), "ListenTestPage"),
});

// A transcript per record (accessibility core, step 7): linked from Listen, each Official record and How we know.
const transcriptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "transcript",
  validateSearch: transcriptSearch,
  component: lazyRouteComponent(() => import("@/components/pages/Transcript"), "TranscriptPage"),
});

export const routeTree = rootRoute.addChildren([homeRoute, listenRoute, thenNowRoute, howRoute, officialRoute, turntableRoute, teamRoute, listenTestRoute, transcriptRoute]);
