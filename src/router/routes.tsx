import { createRootRoute, createRoute, lazyRouteComponent } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { HomePage } from "@/components/pages/Home";
import { NotFoundPage } from "@/components/pages/NotFound";
import { listenSearch, officialSearch, thenNowSearch } from "./search";

// Six places and a 404 (docs/L3/REDESIGN.md §2; Official and Turntable joined from bloop-dev). Then vs Now, How we
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

export const routeTree = rootRoute.addChildren([homeRoute, listenRoute, thenNowRoute, howRoute, officialRoute, turntableRoute]);
