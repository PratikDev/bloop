"use client";

import { Brand } from "./Brand";
import { SettingsMenu } from "./SettingsMenu";
import { TuningDial } from "./TuningDial";

/**
 * One slim bar on every page: the name, the pages as pills,
 * then settings (language and help are inside). Below 1024 px the dial gets its own row.
 * It keeps its own view-transition name, so it stays still while pages retune.
 */
export function Header() {
  return (
    <header className="relative z-(--layer-header) grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 px-4 [view-transition-name:header] lg:grid-cols-[1fr_auto_1fr] lg:px-8">
      <Brand />
      <TuningDial className="col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1" />
      <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 lg:col-start-3">
        <SettingsMenu />
      </div>
    </header>
  );
}
