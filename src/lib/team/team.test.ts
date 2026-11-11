// Mentor item 7: the Team page shows only filled fields (never "TODO"), and a release build stops while any remain.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { parseTeam, releaseCheck, shownTeam, todoFields } from "./index";

const read = (name: string) => parseTeam(JSON.parse(readFileSync(`src/lib/team/fixtures/${name}.json`, "utf8")));
const runCheck = (file: string, release: boolean) =>
  Bun.spawnSync(["bun", "scripts/check-team.ts", file], { env: { ...process.env, BLOOP_RELEASE: release ? "1" : "" } }).exitCode;

describe("team.json", () => {
  test("TODO fields are never shown", () => {
    const shown = shownTeam(read("todo"));
    expect(shown.teamName).toBeNull();
    expect(shown.members).toEqual([]);
    expect(JSON.stringify(shown)).not.toContain("TODO");
    const mixed = shownTeam({ ...read("filled"), members: [{ name: "Member One", role: "TODO" }] });
    expect(mixed.members).toEqual([{ name: "Member One", role: null }]);
  });

  test("the TODO list names each field", () => {
    expect(todoFields(read("todo"))).toEqual(["teamName", "members[0].name", "members[0].role"]);
    expect(todoFields(read("filled"))).toEqual([]);
  });

  test("release check: fails on a TODO fixture, passes on a filled one, and never fails outside a release", () => {
    expect(releaseCheck(read("todo"), true).ok).toBe(false);
    expect(releaseCheck(read("filled"), true).ok).toBe(true);
    expect(releaseCheck(read("todo"), false).ok).toBe(true);
    expect(runCheck("src/lib/team/fixtures/todo.json", true)).toBe(1);
    expect(runCheck("src/lib/team/fixtures/filled.json", true)).toBe(0);
    expect(runCheck("src/lib/team/fixtures/todo.json", false)).toBe(0);
  });

  test("the shipped file parses, and names only people the repo names (a git author the docs also name)", () => {
    const file = parseTeam(JSON.parse(readFileSync("content/team.json", "utf8")));
    const authors = new Set(Bun.spawnSync(["git", "log", "--format=%an"]).stdout.toString().split(/\r?\n/u));
    const docs = readFileSync("docs/MENTOR_FIXES.md", "utf8");
    for (const m of shownTeam(file).members) expect([m.name, authors.has(m.name), docs.includes(m.name.split(" ")[0])]).toEqual([m.name, true, true]);
    if (shownTeam(file).teamName) expect(readFileSync("LICENSE", "utf8")).toContain(file.teamName);
  });
});
