"use client";

import { FLAGS } from "@/lib/flags";
import { useState } from "react";
import { LowVisionPanel } from "../LowVision/Panel";
import { Brand } from "./Brand";
import { HeaderControls } from "./Controls";
import { MenuBar } from "./MenuBar";
import { TuningDial } from "./TuningDial";

/**
 * One slim bar on every page: the name, the pages as pills, then language, Settings and Help (always there; they
 * don't count toward a page's controls). Below 1024 px the pages and controls move into a menu behind a hamburger.
 * It keeps its own view-transition name, so it stays still while pages retune.
 */
export function Header() {
	const [lvOpen, setLvOpen] = useState(false);
	return (
		<header className="relative z-(--layer-header) py-2 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 px-4 [view-transition-name:header] lg:grid-cols-[1fr_auto_1fr] lg:px-8">
			<Brand />
			<TuningDial className="max-lg:hidden lg:col-start-2" />
			<HeaderControls
				lvOpen={lvOpen}
				onLvOpenChange={setLvOpen}
				className="justify-end max-lg:hidden lg:col-start-3 lg:flex-nowrap"
			/>
			<MenuBar
				lvOpen={lvOpen}
				onLvOpenChange={setLvOpen}
				className="ms-auto lg:hidden"
			/>
			{FLAGS.lowVision && lvOpen && (
				<LowVisionPanel
					onClose={() => setLvOpen(false)}
					className="col-span-full mt-2"
				/>
			)}
		</header>
	);
}
