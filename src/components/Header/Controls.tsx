"use client";

import { Question } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { FLAGS } from "@/lib/flags";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { LanguageChoice } from "../LanguageChoice";
import { type IconOnly, LowVisionButtons } from "../LowVision/HeaderButtons";
import { HEADER_KEY } from "./header-key";
import { SettingsMenu } from "./SettingsMenu";

/**
 * Language, low vision, Settings and Help: in the header from 1024 px, in the phone menu below it. `onLeave` runs
 * before a control that opens something elsewhere (Help, the low-vision panel), so the menu can close first.
 */
export function HeaderControls({ lvOpen, onLvOpenChange, onLeave, iconOnly = "belowXl", className }: { lvOpen: boolean; onLvOpenChange: (open: boolean) => void; onLeave?: () => void; iconOnly?: IconOnly; className?: string }) {
	const t = useT();
	const commands = useCommands();
	return (
		<div className={cn("flex flex-wrap items-center gap-2", className)}>
			<LanguageChoice />
			{FLAGS.lowVision && (
				<LowVisionButtons
					open={lvOpen}
					iconOnly={iconOnly}
					onOpenChange={(open) => {
						onLeave?.();
						onLvOpenChange(open);
					}}
				/>
			)}
			<SettingsMenu />
			<Button
				variant="ghost"
				size="icon-lg"
				onClick={() => {
					onLeave?.();
					commands.openHelp();
				}}
				aria-label={t("help.open")}
				className={HEADER_KEY}
			>
				<Question
					aria-hidden="true"
					className="size-5"
				/>
			</Button>
		</div>
	);
}
