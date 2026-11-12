"use client";

import { useState } from "react";
import { List } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { Brand } from "./Brand";
import { HeaderControls } from "./Controls";
import { HEADER_KEY } from "./header-key";
import { TuningDial } from "./TuningDial";

/** Below 1024 px: a hamburger at the far right that slides in the pages and the controls from the right. */
export function MenuBar({ lvOpen, onLvOpenChange, className }: { lvOpen: boolean; onLvOpenChange: (open: boolean) => void; className?: string }) {
	const t = useT();
	const [open, setOpen] = useState(false);
	const close = () => setOpen(false);
	return (
		<Sheet
			open={open}
			onOpenChange={setOpen}
		>
			<SheetTrigger
				render={
					<Button
						variant="ghost"
						size="icon-lg"
						aria-label={t("nav.menu")}
						className={cn(HEADER_KEY, className)}
					/>
				}
			>
				<List
					aria-hidden="true"
					className="size-5"
				/>
			</SheetTrigger>
			<SheetContent
				side="right"
				closeLabel={t("inspector.close")}
				className="gap-0 overflow-y-auto rounded-l-plate p-0 data-[side=right]:w-[min(22rem,88vw)]"
			>
				{/* The name links home; picking it closes the menu like a page does. */}
				<SheetHeader
					onClick={close}
					className="border-b-(length:--outline) border-navy px-5 pt-4 pb-3"
				>
					<Brand />
					<SheetTitle className="sr-only">{t("nav.menu")}</SheetTitle>
				</SheetHeader>

				<div className="flex flex-1 flex-col gap-6 px-5 py-5">
					<section className="space-y-3">
						<h2 className="eyebrow px-1">{t("nav.label")}</h2>
						<TuningDial
							vertical
							onNavigate={close}
						/>
					</section>

					<section className="space-y-3">
						<h2 className="eyebrow px-1">{t("nav.controls")}</h2>
						<HeaderControls
							lvOpen={lvOpen}
							onLvOpenChange={onLvOpenChange}
							onLeave={close}
						/>
					</section>
				</div>
			</SheetContent>
		</Sheet>
	);
}
