"use client";

import { useState } from "react";

/** `value`, except that it keeps its last non-null value while `hold` is on or the value is null. */
export function useHeld<T>(value: T | null, hold: boolean): T | null {
  const [held, setHeld] = useState(value);
  if (!hold && value !== null && value !== held) setHeld(value);
  return hold || value === null ? held : value;
}
