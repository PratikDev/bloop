"use client";

import { placeLabel } from "@/lib/history";
import { parseTeam, shownTeam } from "@/lib/team";
import teamJson from "../../../../content/team.json";
import { useT } from "../../AppState/use-app-state";
import { DataCreditsDialog } from "./DataCreditsDialog";
import { MemberCard } from "./MemberCard";

const TEAM = shownTeam(parseTeam(teamJson));

/**
 * Team and about (mentor item 7), from content/team.json: members as a photo grid, the challenge, local event and
 * licence as one info strip, and the data credits in a dialog. A field still "TODO" shows nothing.
 */
export function TeamPage() {
	const t = useT();
	const meta = [
		TEAM.localEvent &&
			t("team.localEvent", { place: placeLabel(t, TEAM.localEvent) }),
		TEAM.licence && t("team.licence", { licence: TEAM.licence }),
	].filter(Boolean);
	return (
		<section
			aria-labelledby="team-title"
			className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-3 pb-6 md:px-8"
		>
			<header className="space-y-4">
				<div className="space-y-1">
					<h1
						id="team-title"
						data-page-title
						tabIndex={-1}
						className="display-tight font-wide text-headline"
					>
						{TEAM.teamName ?? t("team.title")}
					</h1>
					<p className="max-w-2xl text-body text-haze">{t("team.lead")}</p>
				</div>

				<div className="surface-plate flex flex-col gap-3 rounded-plate px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
					<div className="space-y-0.5">
						<h2 className="sr-only">{t("team.challenge")}</h2>
						{TEAM.challenge && (
							<p
								lang="en"
								className="font-medium text-body text-moon"
							>
								{TEAM.challenge}
							</p>
						)}
						{meta.length > 0 && (
							<p className="text-small text-haze">{meta.join(" · ")}</p>
						)}
					</div>
					<DataCreditsDialog />
				</div>
			</header>

			<section
				aria-labelledby="team-members"
				className="mx-auto max-w-5xl"
			>
				<h2
					id="team-members"
					className="sr-only"
				>
					{t("team.members")}
				</h2>
				{/* 6 tracks, each card spans 2: the first row's two cards start at track 2 so they sit centred over the three below. */}
				<ul className="grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-4 md:*:col-span-2 md:[&>li:first-child]:col-start-2">
					{TEAM.members.map((m) => (
						<MemberCard
							key={m.name}
							member={m}
						/>
					))}
				</ul>
			</section>
		</section>
	);
}
