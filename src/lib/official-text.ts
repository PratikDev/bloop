// How the official records' own wording is shown: plain formatting of what the manifests say, never new facts.

/** "19 Aug 2025 – 19 Aug 2025" reads as one date. */
export function collapseRange(label: string): string {
  const [from, to, ...rest] = label.split(/\s+(?:–|to)\s+/u);
  return to !== undefined && rest.length === 0 && from === to ? from : label;
}

/** The pipeline's shorthand for its comparison with NASA's reanalysis, in words. */
export function plainStatement(statement: string): string {
  return statement.replace(/rank vs MERRA-2 ρ/gu, "agreement with NASA MERRA-2: ρ");
}
