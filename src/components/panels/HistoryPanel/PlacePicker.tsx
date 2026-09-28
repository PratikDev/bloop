"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLACES } from "@/lib/history";
import type { GlobalPlace } from "@/types/data-contract";
import { useT } from "../../AppState/use-app-state";

/**
 * Bangladesh's four cities first, then L1's world places. A list, not toggle
 * buttons: 42 places don't fit as buttons, least of all on a phone.
 */
export function PlacePicker({ value, onChange, world, name }: { value: string; onChange: (place: string) => void; world: GlobalPlace[]; name: (place: string) => string }) {
  const t = useT();
  const others = world.filter((p) => !p.in_bangladesh);
  return (
    <div className="space-y-1.5">
      <p aria-hidden="true" className="text-small font-medium text-haze">
        {t("history.place")}
      </p>
      <Select value={value} onValueChange={(v: string | null) => v && onChange(v)}>
        <SelectTrigger aria-label={t("history.place")} className="h-11 min-w-56 border-line px-3 text-body md:pointer-fine:h-9">
          <SelectValue>{name(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-dusk text-moon">
          <SelectGroup>
            <SelectLabel className="text-small text-haze">{t("history.group.bangladesh")}</SelectLabel>
            {PLACES.map((p) => (
              <SelectItem key={p} value={p} className="text-body">
                {name(p)}
              </SelectItem>
            ))}
          </SelectGroup>
          {others.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-small text-haze">{t("history.group.world")}</SelectLabel>
              {others.map((p) => (
                <SelectItem key={p.name} value={p.name} className="text-body">
                  {name(p.name)}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
