// English strings for the Team and about page. Names, the challenge and the licence come from
// content/team.json and stay as written.

export const teamEn = {
  "nav.team": "Team",
  "team.title": "Team and about",
  "team.lead": "Who made this app, for which challenge, and the NASA data it plays.",
  "team.members": "Team members",
  "team.challenge": "Challenge",
  "team.localEvent": (p: { place: string }) => `Local event: ${p.place}`,
  "team.madeWith": "Made with NASA data",
  "team.licence": (p: { licence: string }) => `Code licence: ${p.licence}.`,
};
