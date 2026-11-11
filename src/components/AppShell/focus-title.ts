type TitleFocus = "focus" | "wait" | "stop";

interface FocusSnapshot {
  lost: boolean;
  unmoved: boolean;
  inHeader: boolean;
  heading: boolean;
}

export function titleFocus({ lost, unmoved, inHeader, heading }: FocusSnapshot): TitleFocus {
  if (!lost && !unmoved) return "stop";
  if (lost || inHeader) return heading ? "focus" : "wait";
  return "wait";
}
