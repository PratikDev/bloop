// When the app may fetch data ahead of need (the rain grid while the first page is idle): never on a connection that
// asks to save data or is 3G or slower. The Network Information API is Chromium's; without it (Firefox, Safari) the
// prefetch stays on.

/** The part of the Network Information API read here (it isn't in TypeScript's DOM types). */
interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

const SLOW_CONNECTIONS: ReadonlySet<string> = new Set(["slow-2g", "2g", "3g"]);

/** False on Data Saver or a slow connection; true otherwise, and where the browser doesn't say. */
export function connectionAllowsPrefetch(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!connection) return true;
  return connection.saveData !== true && !SLOW_CONNECTIONS.has(connection.effectiveType ?? "");
}
