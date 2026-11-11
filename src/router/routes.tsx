import { createRootRoute, createRoute, lazyRouteComponent } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { HomePage } from "@/components/pages/Home";
import { ListenPage } from "@/components/pages/Listen";
import { NotFoundPage } from "@/components/pages/NotFound";
import { listenSearch, thenNowSearch, transcriptSearch } from "./search";

// know, Official and Turntable load their code (the chart library, three.js) only when opened.

const rootRoute = createRootRoute({ component: AppShell, notFoundComponent: NotFoundPage });

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: HomePage });

const listenRoute = createRoute({ getParentRoute: () => rootRoute, path: "listen", validateSearch: listenSearch, component: ListenPage });

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
  component: lazyRouteComponent(() => import("@/components/pages/Team"), "TeamPage"),
});

const listenTestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "listen-test",
  component: lazyRouteComponent(() => import("@/components/pages/ListenTest"), "ListenTestPage"),
});

const transcriptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "transcript",
  validateSearch: transcriptSearch,
  component: lazyRouteComponent(() => import("@/components/pages/Transcript"), "TranscriptPage"),
});

export const routeTree = rootRoute.addChildren([homeRoute, listenRoute, thenNowRoute, howRoute, officialRoute, turntableRoute, teamRoute, listenTestRoute, transcriptRoute]);
