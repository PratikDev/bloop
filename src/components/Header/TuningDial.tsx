"use client";

import { cn } from "@/lib/utils";
import { CaretRight } from "@phosphor-icons/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useT } from "../AppState/use-app-state";
import { NAV_ITEMS } from "./nav-items";

/**
 * The pages as pills: navy for the current one, paper for the rest. In the header they run in a row; in the phone
 * menu (`vertical`) they stack full width with their full names.
 */
export function TuningDial({
	className,
	vertical = false,
	onNavigate,
}: {
	className?: string;
	vertical?: boolean;
	/** Called when a page is picked (the menu closes). */ onNavigate?: () => void;
}) {
	const t = useT();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return (
		<nav
			aria-label={t("nav.label")}
			className={cn("min-w-0", className)}
		>
			{/* In a row, a 320 px phone scrolls it sideways inside itself, never the page; the padding leaves room for the shadows. */}
			<ul
				className={cn(
					vertical
						? "flex flex-col gap-3 pr-1"
						: "flex items-center gap-2 overflow-x-auto pb-1 pr-1 pl-0.5 scrollbar-none",
				)}
			>
				{NAV_ITEMS.map((item) => {
					const active = pathname === item.to;
					return (
						<li
							key={item.to}
							className="shrink-0"
						>
							<Link
								to={item.to}
								onClick={onNavigate}
								aria-current={active ? "page" : undefined}
								className={cn(
									"key border-navy flex items-center rounded-full whitespace-nowrap",
									vertical
										? "h-12 w-full justify-between px-5 text-lead"
										: "h-11 px-4 text-body",
									active ? "bg-moon text-ink" : "bg-paper text-moon",
								)}
							>
								{vertical ? (
									<>
										{t(item.label)}
										<CaretRight
											aria-hidden="true"
											className="size-4"
										/>
									</>
								) : (
									<>
										<span className="hidden sm:inline">{t(item.label)}</span>
										<span className="sm:hidden">{t(item.short)}</span>
									</>
								)}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
