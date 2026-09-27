export class DataLoadError extends Error {
  constructor(
    readonly url: string,
    readonly status: number | null,
  ) {
    super(`Couldn't load ${url}${status === null ? "" : ` (HTTP ${status})`}`);
    this.name = "DataLoadError";
  }
}

async function get(url: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new DataLoadError(url, null);
  }
  if (!res.ok) throw new DataLoadError(url, res.status);
  return res;
}

/** Fetches one of L1's JSON files. The shape is the contract type the caller names. */
export async function fetchJson<T>(url: string): Promise<T> {
  return (await get(url)).json() as Promise<T>;
}

export async function fetchBuffer(url: string): Promise<ArrayBuffer> {
  return (await get(url)).arrayBuffer();
}
