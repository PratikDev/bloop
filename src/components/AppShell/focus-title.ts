/**
 * After a page change, whether to put focus on the new page's heading (screen readers read it; Tab continues from the
 * top of the new page). Only when focus is still where the move left it, on the header link that moved it, or was lost
 * with the old page. Once focus moves anywhere else (the user Tabs to a header link, a page or an overlay places it),
 * it stays there: taking it from a link focused after the move sent the next Enter to the heading.
 */
type TitleFocus = "focus" | "wait" | "stop";

interface FocusSnapshot {
  /** Focus is on nothing (the body, or an element removed with the old page). */
  lost: boolean;
  /** Focus is on the element that had it when the new page came up. */
  unmoved: boolean;
  /** That element is in the header (the link that moved the page). */
  inHeader: boolean;
  /** The new page's heading is in the document. */
  heading: boolean;
}

export function titleFocus({ lost, unmoved, inHeader, heading }: FocusSnapshot): TitleFocus {
  if (!lost && !unmoved) return "stop";
  if (lost || inHeader) return heading ? "focus" : "wait";
  return "wait"; // an overlay or the page still holds it: look again next frame
}
