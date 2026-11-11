// The control that opened the braille explorer, so closing it puts focus back there (the B key leaves it on the
// map; More's item hands over the More key, since the item itself goes away with its menu).

let opener: HTMLElement | null = null;

export function setBrailleOpener(el: Element | null): void {
  opener = el instanceof HTMLElement ? el : null;
}

/** The opener, if it is still on the page; used up. */
export function takeBrailleOpener(): HTMLElement | null {
  const el = opener;
  opener = null;
  return el?.isConnected ? el : null;
}
