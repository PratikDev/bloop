// Esc is global (stop all sound, close panels). A view can claim one Esc first
// for something smaller (close its search, stop its tour): the newest handler
// that returns true consumes the key and the global Esc doesn't run.

type EscapeHandler = () => boolean;
const handlers: EscapeHandler[] = [];

export function pushEscapeHandler(handler: EscapeHandler): () => void {
  handlers.push(handler);
  return () => {
    const i = handlers.lastIndexOf(handler);
    if (i !== -1) handlers.splice(i, 1);
  };
}

/** Offers Esc to the claimed handlers, newest first; true if one used it. */
export function consumeEscape(): boolean {
  for (let i = handlers.length - 1; i >= 0; i--) if (handlers[i]()) return true;
  return false;
}
