// Where focus goes when the visitor arrives somewhere on purpose, asked for by the click that leads there:
// - "map": from Start or Continue listening, the sound map takes focus once the intro ends, so the arrow keys work at
//   once (audit A2). Any other arrival on Listen keeps focus on the page heading.
// - "tour": the tour started from the player puts focus on the tour panel's heading (audit A11).

export type ArrivalTarget = "map" | "tour";

const requested = new Set<ArrivalTarget>();

/** Call in the click that leads there. */
export function requestFocus(target: ArrivalTarget): void {
  requested.add(target);
}

/** Whether `target` should take focus now; uses the request up. */
export function takeFocus(target: ArrivalTarget): boolean {
  return requested.delete(target);
}
