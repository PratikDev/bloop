// What is data, what is our artistic choice, in Bangla: a developer's DRAFT.

import type { choicesEn } from "../en/art-choices";

export const choicesBn: Partial<typeof choicesEn> = {
  "choices.fromData": "ডেটা থেকে:",
  "choices.ourChoice": "আমাদের শিল্পিত পছন্দ:",
  "choices.data.pitch": (p: { unit: string }) => `সুরের উচ্চতা মান অনুসরণ করে (${p.unit})`,
  "choices.data.rate": (p: { unit: string }) => `কত ঘনঘন বাজে তা মান অনুসরণ করে (${p.unit})`,
  "choices.data.brightness": (p: { unit: string }) => `উজ্জ্বলতা মান অনুসরণ করে (${p.unit})`,
  "choices.data.loudness": (p: { unit: string }) => `জোর মান অনুসরণ করে (${p.unit})`,
  "choices.data.echo": (p: { unit: string }) => `প্রতিধ্বনির দৈর্ঘ্য মান অনুসরণ করে (${p.unit})`,
  "choices.data.silence": "নীরবতা মানে কোনো ডেটা নেই",
  "choices.data.none": "কোনো মান এই শব্দ চালায় না",
  "choices.range": (p: { min: string; max: string; unit: string; scale: string }) => `পরিসর, ${p.min} থেকে ${p.max} ${p.unit}, ${p.scale}`,
  "choices.scale.exponential": "সূচকীয়",
  "choices.scale.linear": "রৈখিক",
  "choices.timbre": (p: { instrument: string }) => `বাদ্য: ${p.instrument}`,
  "choices.legend": "লেজেন্ডের বিন্দুগুলো",
  "choices.dial": (p: { stop: string; list: string }) => `ডায়াল ${p.stop}-এ: ${p.list}`,
};
