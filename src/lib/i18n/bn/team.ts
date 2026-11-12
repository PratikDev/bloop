// Bangla for the Team and about page (src/lib/i18n/en/team.ts). Draft, needs review (bn/drafts.ts).

import type { teamEn } from "../en/team";
import type { Translated } from "../types";

export const teamBn: Translated<typeof teamEn> = {
  "nav.team": "দল",
  "team.title": "দল ও পরিচিতি",
  "team.lead": "এই অ্যাপ কারা বানিয়েছে, কোন চ্যালেঞ্জের জন্য, আর এটি নাসার কোন ডেটা বাজায়।",
  "team.members": "দলের সদস্য",
  "team.challenge": "চ্যালেঞ্জ",
  "team.localEvent": (p: { place: string }) => `স্থানীয় আয়োজন: ${p.place}`,
  "team.madeWith": "নাসার ডেটা দিয়ে তৈরি",
  "team.licence": (p: { licence: string }) => `কোডের লাইসেন্স: ${p.licence}।`,
};
