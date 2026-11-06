// Light checks on L1's files, so a changed shape shows a clear error message
// instead of breaking a component halfway through a demo.

export class DataShapeError extends Error {
  constructor(file: string, what: string) {
    super(`${file}: ${what}. The file no longer matches src/types/data-contract.ts.`);
    this.name = "DataShapeError";
  }
}

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

/** Walks a dotted path ("heat.A.values") and checks it exists with the right kind. */
export function requirePaths(file: string, root: unknown, paths: Record<string, "array" | "number" | "string" | "object" | "boolean">): void {
  for (const [path, kind] of Object.entries(paths)) {
    let node: unknown = root;
    for (const key of path.split(".")) node = isObject(node) ? node[key] : undefined;
    const ok = kind === "array" ? Array.isArray(node) : kind === "object" ? isObject(node) : typeof node === kind;
    if (!ok) throw new DataShapeError(file, `"${path}" is missing or is not ${kind === "array" ? "an array" : `a ${kind}`}`);
  }
}
