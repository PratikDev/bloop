// The yearly series file (public/data/thenvsnow/lifetime.json, written by pipeline/stats/lifetime_stats.py): one
// loader for "Your lifetime", Water's journey and the data-voice check.

import { fetchJson } from "@/lib/data/fetch";
import type { LifetimeFile } from "./song";

const LIFETIME_PATH = "/data/thenvsnow/lifetime.json";
export const loadLifetime = () => fetchJson<LifetimeFile>(LIFETIME_PATH);
