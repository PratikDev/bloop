// The Team/About page's content: content/team.json, filled by the team. A field still "TODO" shows
// nothing on the page (never the word), and a release build (BLOOP_RELEASE=1) refuses to build while one remains
// (scripts/check-team.ts).

export const TODO = "TODO";

interface TeamMember {
  name: string;
  role: string;
}

interface TeamFile {
  teamName: string;
  members: TeamMember[];
  challenge: string;
  localEvent: string;
  licence: string;
}

const filled = (v: string): string | null => (v.trim() === "" || v.trim() === TODO ? null : v.trim());

interface ShownMember {
  name: string;
  role: string | null;
}

/** What the page shows: every field that isn't TODO; a member with no name isn't shown. */
interface ShownTeam {
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
      return name ? [{ name, role: filled(m.role) }] : [];
    }),
    challenge: filled(file.challenge),
    localEvent: filled(file.localEvent),
    licence: filled(file.licence),
  };
}

/** The JSON paths still TODO (or empty), e.g. "members[0].role". */
export function todoFields(file: TeamFile): string[] {
  const out: string[] = [];
  for (const key of ["teamName", "challenge", "localEvent", "licence"] as const) if (!filled(file[key])) out.push(key);
  if (!file.members.length) out.push("members");
  file.members.forEach((m, i) => {
    if (!filled(m.name)) out.push(`members[${i}].name`);
    if (!filled(m.role)) out.push(`members[${i}].role`);
  });
  return out;
}

/** The release check: ok unless BLOOP_RELEASE=1 and a field is still TODO. */
export function releaseCheck(file: TeamFile, release: boolean): { ok: boolean; todo: string[] } {
  const todo = todoFields(file);
  return { ok: !release || todo.length === 0, todo };
}

/** Reads a parsed JSON value as a TeamFile, or throws naming the first wrong field. */
export function parseTeam(raw: unknown): TeamFile {
  const o = raw as Partial<Record<keyof TeamFile, unknown>>;
  const str = (k: keyof TeamFile) => {
    if (typeof o[k] !== "string") throw new Error(`team.json: "${k}" must be a string`);
    return o[k] as string;
  };
  if (!Array.isArray(o.members)) throw new Error('team.json: "members" must be a list');
  const members = o.members.map((m: { name?: unknown; role?: unknown }, i: number) => {
    if (typeof m?.name !== "string" || typeof m?.role !== "string") throw new Error(`team.json: members[${i}] needs a "name" and a "role"`);
    return { name: m.name, role: m.role };
  });
  return { teamName: str("teamName"), members, challenge: str("challenge"), localEvent: str("localEvent"), licence: str("licence") };
}
