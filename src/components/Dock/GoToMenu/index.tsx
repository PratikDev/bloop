"use client";

import { useId, useRef, useState } from "react";
import { MapPin } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import type { CoordAxis } from "@/lib/geo";
import { useAppState, useT } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { MAP_REGION_ID } from "../../ExploreControls";
import { StatusBadge } from "../../StatusBadge";
import { DockAction } from "../DockAction";
import { AXES, useGoToForm } from "./use-go-to-form";

const LABELS = { lat: "goto.lat", lon: "goto.lon" } as const satisfies Record<CoordAxis, string>;

/**
 * Go to: type an exact latitude and longitude and the cursor goes there. It
 * opens on the cursor's own place; after Go, focus is back on the map, so the
 * arrow keys carry on from the new place (and the map announces it).
 */
export function GoToMenu() {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  const [open, setOpen] = useState(false);
  const went = useRef(false);
  const inputs = { lat: useRef<HTMLInputElement>(null), lon: useRef<HTMLInputElement>(null) };
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const form = useGoToForm(state.lang, (place) => {
    commands.setCursor(place);
    went.current = true;
    setOpen(false);
  });

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          form.reset(state.cursor);
          went.current = false;
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger render={<DockAction icon={<MapPin aria-hidden="true" />} full={t("goto.open")} label={t("dock.short.goto")} short={t("dock.short.goto")} />} />
      <PopoverContent
        side="top"
        align="start"
        sideOffset={12}
        finalFocus={() => (went.current ? document.getElementById(MAP_REGION_ID) : true)}
        className="surface-glass w-[min(22rem,calc(100vw-1.5rem))] gap-3 rounded-plate p-4 text-body"
      >
        <PopoverTitle className="eyebrow">{t("goto.title")}</PopoverTitle>
        <form
          noValidate
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const bad = form.submit();
            if (bad) inputs[bad].current?.focus();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            {AXES.map((axis) => (
              <div key={axis} className="space-y-1.5">
                <Label htmlFor={`${id}-${axis}`} className="text-small font-normal text-haze">
                  {t(LABELS[axis])}
                </Label>
                <Input
                  ref={inputs[axis]}
                  id={`${id}-${axis}`}
                  value={form.values[axis]}
                  onChange={(e) => form.change(axis, e.currentTarget.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={form.invalid === axis || undefined}
                  aria-describedby={form.invalid === axis ? `${errorId} ${hintId}` : hintId}
                  className="h-11 rounded-lg border-line bg-ink/45 px-3 font-mono md:text-base pointer-fine:h-9"
                />
              </div>
            ))}
          </div>
          <p id={hintId} className="text-small text-haze">
            {t("goto.hint")}
          </p>
          <div aria-live="polite">
            {form.error && (
              <StatusBadge kind="error">
                <span id={errorId}>{t(form.error)}</span>
              </StatusBadge>
            )}
          </div>
          <Button type="submit" className="h-11 w-full gap-2 rounded-full bg-shapla text-body text-ink hover:bg-shapla/90 pointer-fine:h-9">
            <MapPin aria-hidden="true" weight="fill" />
            {t("goto.submit")}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
