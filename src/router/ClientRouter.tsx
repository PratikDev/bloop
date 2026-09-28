"use client";

import dynamic from "next/dynamic";
import { Splash } from "./Splash";

// The router reads window.location, so it renders in the browser only; the
// splash (server-rendered) holds the page until the app's code arrives.
export const ClientRouter = dynamic(() => import("./RouterApp").then((m) => m.RouterApp), { ssr: false, loading: Splash });
