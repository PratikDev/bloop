"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { CHOICE_GROUP, CHOICE_ITEM, ChoiceHighlight, type Choice } from "./ChoiceGroup";

const NEXT = new Set(["ArrowRight", "ArrowDown"]);
const PREVIOUS = new Set(["ArrowLeft", "ArrowUp"]);

/**
 * Pick exactly one, as a labelled radio group: the visible label names it (`aria-labelledby`), it is one Tab stop,
 * and the arrow keys (and Home, End) move to an option and choose it. Drawn like ChoiceGroup's pill.
 */
export function RadioChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
  className,
}: {
  label: string;
  /** One short sentence under the label (muted, 14 px), read with the group. */
  hint?: string;
  options: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const labelId = useId();
  const hintId = useId();
  const highlightId = useId();
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const at = Math.max(0, options.findIndex((o) => o.value === value));

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = options.length - 1;
    const to = NEXT.has(e.key) ? (at === last ? 0 : at + 1) : PREVIOUS.has(e.key) ? (at === 0 ? last : at - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (to === null) return;
    e.preventDefault();
    onChange(options[to].value);
    items.current[to]?.focus();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-0.5">
        <p id={labelId} className="text-body font-medium text-moon">
          {label}
        </p>
        {hint && (
          <p id={hintId} className="text-small text-haze">
            {hint}
          </p>
        )}
      </div>
      <div role="radiogroup" aria-labelledby={labelId} aria-describedby={hint ? hintId : undefined} onKeyDown={onKeyDown} className={cn(CHOICE_GROUP, "inline-flex flex-wrap gap-1")}>
        {options.map((o, i) => {
          const chosen = i === at;
          return (
            <button
              key={o.value}
              ref={(el) => {
                items.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={chosen}
              tabIndex={chosen ? 0 : -1}
              lang={o.lang}
              onClick={() => onChange(o.value)}
              className={CHOICE_ITEM}
            >
              {chosen && <ChoiceHighlight id={highlightId} className="rounded-full" />}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
