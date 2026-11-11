import { fetchJson } from "@/lib/data/fetch";
import type { LifetimeFile } from "./song";

const LIFETIME_PATH = "/data/thenvsnow/lifetime.json";
export const loadLifetime = () => fetchJson<LifetimeFile>(LIFETIME_PATH);
