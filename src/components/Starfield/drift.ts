/** How far the sky moves per radian the globe turns: 5% of the globe's surface speed, as a share of one tile. */
const TILES_PER_RADIAN = 0.05 * 0.43;

/** Shifts the sky opposite to the globe's turn, wrapping at one tile (the element is two tiles wide). */
export function setStarDrift(element: HTMLElement, lon: number): void {
  const tile = ((-lon * TILES_PER_RADIAN) % 1 + 1) % 1;
  element.style.transform = `translateX(${(-tile * 50).toFixed(3)}%)`;
}
