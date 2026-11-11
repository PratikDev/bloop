import { readFileSync } from "node:fs";
import { parseTeam, releaseCheck } from "../src/lib/team";

const path = process.argv[2] ?? "content/team.json";
const release = process.env.BLOOP_RELEASE === "1";
const { ok, todo } = releaseCheck(parseTeam(JSON.parse(readFileSync(path, "utf8"))), release);
if (todo.length) console.log(`${path}: still TODO (not shown on the Team page): ${todo.join(", ")}`);
if (!ok) {
  console.error(`BLOOP_RELEASE=1: fill in ${path} before a release build.`);
  process.exit(1);
}
