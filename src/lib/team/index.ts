// The Team/About page's content (mentor item 7): content/team.json, filled by the team. A field still "TODO" shows
// nothing on the page (never the word).

export const TODO = "TODO";

export interface TeamMember {
  name: string;
  role: string;
  /** A path under public/, e.g. "/images/team/pratik.jpeg". Optional: a member without one shows initials. */
  photo?: string;
}

export interface TeamFile {
  teamName: string;
  members: TeamMember[];
  challenge: string;
  localEvent: string;
  licence: string;
}

const filled = (v: string): string | null => (v.trim() === "" || v.trim() === TODO ? null : v.trim());

export interface ShownMember {
  name: string;
  role: string | null;
  photo: string | null;
}

/** What the page shows: every field that isn't TODO; a member with no name isn't shown. */
export interface ShownTeam {
  teamName: string | null;
  members: ShownMember[];
  challenge: string | null;
  localEvent: string | null;
  licence: string | null;
}

export function shownTeam(file: TeamFile): ShownTeam {
  return {
    teamName: filled(file.teamName),
    members: file.members.flatMap((m) => {
      const name = filled(m.name);
      return name ? [{ name, role: filled(m.role), photo: filled(m.photo ?? "") }] : [];
    }),
    challenge: filled(file.challenge),
    localEvent: filled(file.localEvent),
    licence: filled(file.licence),
  };
}

/** Reads a parsed JSON value as a TeamFile, or throws naming the first wrong field. */
export function parseTeam(raw: unknown): TeamFile {
  const o = raw as Partial<Record<keyof TeamFile, unknown>>;
  const str = (k: keyof TeamFile) => {
    if (typeof o[k] !== "string") throw new Error(`team.json: "${k}" must be a string`);
    return o[k] as string;
  };
  if (!Array.isArray(o.members)) throw new Error('team.json: "members" must be a list');
  const members = o.members.map((m: { name?: unknown; role?: unknown; photo?: unknown }, i: number) => {
    if (typeof m?.name !== "string" || typeof m?.role !== "string") throw new Error(`team.json: members[${i}] needs a "name" and a "role"`);
    if (m.photo !== undefined && typeof m.photo !== "string") throw new Error(`team.json: members[${i}].photo must be a string`);
    return { name: m.name, role: m.role, photo: m.photo };
  });
  return { teamName: str("teamName"), members, challenge: str("challenge"), localEvent: str("localEvent"), licence: str("licence") };
}
