"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useState, type KeyboardEvent, type Ref } from "react";
import { pushEscapeHandler } from "@/lib/escape";
import type { Gazetteer } from "@/lib/geo/gazetteer";
import type { SearchEntry, SearchKind } from "@/lib/geo/search";
import { cn } from "@/lib/utils";
import { useAnnounce } from "../Announcer/use-announcer";
import { useTT } from "./i18n";
import { localName } from "./place-text";

const KIND_LABELS = {
  story: "turntable.kind.story",
  country: "turntable.kind.country",
  city: "turntable.kind.city",
  district: "turntable.kind.district",
  sea: "turntable.kind.sea",
} as const satisfies Record<SearchKind, string>;

/** Offline place search (English and Bangla) as a combobox with a listbox of results. */
export function SearchBox({
  gazetteer,
  onChoose,
  inputRef,
  className,
}: {
  gazetteer: Gazetteer | null;
  onChoose: (entry: SearchEntry) => void;
  inputRef: Ref<HTMLInputElement>;
  className?: string;
}) {
  const { tt, lang } = useTT();
  const announce = useAnnounce();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = useMemo(() => (gazetteer && query.trim() ? gazetteer.search(query) : []), [gazetteer, query]);
  const expanded = open && query.trim().length > 0;

  // Esc closes the list first (before the app's global Esc).
  useEffect(() => {
    if (!expanded) return;
    return pushEscapeHandler(() => {
      setOpen(false);
      return true;
    });
  }, [expanded]);

  const choose = (entry: SearchEntry | undefined) => {
    if (!entry) return;
    setOpen(false);
    setQuery(localName(entry, lang).text);
    onChoose(entry);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (results.length) setActive((i) => (i + (e.key === "ArrowDown" ? 1 : results.length - 1)) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[active] ?? results[0]);
    }
  };

  const optionId = (i: number) => `${listId}-${i}`;

  return (
    <div className={cn("relative", className)}>
      {/* Compact until used: an icon-sized pill that widens on focus (/ or a click). */}
      <label
        className={cn(
          "glass-chip ml-auto flex h-11 cursor-text items-center gap-2 overflow-hidden rounded-full px-3 transition-[width] duration-200 ease-out focus-within:outline-2 focus-within:outline-shapla motion-reduce:transition-none",
          query ? "w-80 max-w-full" : "w-11 focus-within:w-80 focus-within:max-w-full",
        )}
      >
        <Search aria-hidden="true" className="size-5 shrink-0 text-moon" />
        <span className="sr-only">{tt("turntable.search.label")}</span>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={expanded && results.length ? optionId(active) : undefined}
          placeholder={tt("turntable.search.placeholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
            const n = gazetteer ? gazetteer.search(e.target.value).length : 0;
            if (e.target.value.trim()) announce(gazetteer ? (n ? tt("turntable.search.count", { count: n }) : tt("turntable.search.none")) : tt("turntable.search.loading"));
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-body text-moon placeholder:text-haze focus:outline-none"
        />
      </label>
      <ul
        id={listId}
        role="listbox"
        aria-label={tt("turntable.search.label")}
        hidden={!expanded}
        className="glass-card absolute top-13 right-0 z-30 max-h-80 w-80 max-w-full overflow-y-auto rounded-2xl p-1"
      >
        {!gazetteer && <li className="px-3 py-2 text-body text-haze">{tt("turntable.search.loading")}</li>}
        {gazetteer && results.length === 0 && <li className="px-3 py-2 text-body text-haze">{tt("turntable.search.none")}</li>}
        {results.map((r, i) => {
          const name = localName(r, lang);
          return (
            <li
              key={`${r.kind}:${r.name}:${r.lat}`}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(r)}
              className="flex min-h-11 cursor-pointer flex-col justify-center rounded-md px-3 py-1 aria-selected:bg-tide"
            >
              <span lang={name.lang} className="text-body text-moon">
                {name.text}
              </span>
              <span className="text-body text-haze">
                {tt(KIND_LABELS[r.kind])}
                {r.detail ? ` · ${r.detail}` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
