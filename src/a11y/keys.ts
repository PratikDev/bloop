// Single-key shortcuts (B, R, H) fire only while their region has focus, and never steal typing: a braille
// keyboard types into a field through the screen reader, so a field that takes text keeps every key.

/** True when the key goes to a field that takes text (read-only fields, and aria-readonly ones, don't: their keys are free). */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
    return !target.readOnly && target.getAttribute("aria-readonly") !== "true";
  return target instanceof HTMLElement && target.isContentEditable;
}

/** A plain letter key (no Ctrl, Alt or Meta). */
export function isLetter(e: { key: string; altKey: boolean; ctrlKey: boolean; metaKey: boolean }, letter: string): boolean {
  return !e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === letter;
}
