import { createRootRoute, createRoute, lazyRouteComponent } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { HomePage } from "@/components/pages/Home";
import { ListenPage } from "@/components/pages/Listen";
import { NotFoundPage } from "@/components/pages/NotFound";
import { listenSearch, thenNowSearch } from "./search";

// Four places and a 404 (docs/L3/REDESIGN.md §2). Then vs Now and How we know
// load their code (and the chart library) only when opened.

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

export const routeTree = rootRoute.addChildren([homeRoute, listenRoute, thenNowRoute, howRoute]);
