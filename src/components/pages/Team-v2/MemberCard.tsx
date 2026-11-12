import type { ShownMember } from "@/lib/team";

const initials = (name: string) =>
	name
		.split(/\s+/u)
		.slice(0, 2)
		.map((w) => w[0])
		.join("");

/** One member: a square photo (or their initials), then name and role. */
export function MemberCard({ member }: { member: ShownMember }) {
	return (
		<li className="surface-plate levitate overflow-hidden rounded-plate">
			{member.photo ? (
				// A pre-sized static photo in public/; the static export can't optimise next/image anyway.
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={member.photo}
					alt={member.name}
					loading="lazy"
					decoding="async"
					width={512}
					height={512}
					className="aspect-square w-full object-cover"
				/>
			) : (
				<div
					aria-hidden
					className="flex aspect-square w-full items-center justify-center bg-muted font-wide text-headline text-haze"
				>
					{initials(member.name)}
				</div>
			)}
			<div className="space-y-0.5 p-3 md:p-4">
				<p
					lang="en"
					className="font-medium text-lead text-moon"
				>
					{member.name}
				</p>
				{member.role && (
					<p
						lang="en"
						className="text-small text-haze"
					>
						{member.role}
					</p>
				)}
			</div>
		</li>
	);
}
