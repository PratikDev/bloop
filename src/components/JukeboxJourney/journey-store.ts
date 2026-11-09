// The journey runs once a session, from Home into Listen. The Start and Continue clicks measure the Home jukebox and
// arm it here; the overlay takes that measurement when the intro is over and Listen is open.

const SEEN_KEY = "jukebox.journey.v1";

let armed: DOMRect | null = null;

function seen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function remember(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage blocked: the journey may run again this session, which is harmless.
  }
}

/** Call inside the click: keeps where the Home jukebox is, even while the intro plays over it. */
export function armJourney(): void {
  if (seen()) return;
  const art = document.querySelector("[data-jukebox-art]");
  if (art) armed = art.getBoundingClientRect();
}

/** Forgets an armed journey (the visitor went somewhere else first). */
export function disarmJourney(): void {
  armed = null;
}

/** The measured box, once: taking it uses up this session's journey. */
export function takeJourney(): DOMRect | null {
  const box = armed;
  armed = null;
  if (box) remember();
  return box;
}

export const isJourneyArmed = (): boolean => armed !== null;
