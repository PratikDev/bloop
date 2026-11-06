// Which language the built-in voice speaks for the screen's language (plan §17):
// Bangla when the device has a Bangla voice, otherwise English, so a value is
// still heard (with Bangla on screen) rather than only shown.

import { loadVoices } from "@/lib/audio/speech";
import { pickVoice } from "@/lib/audio/voice-pick";
import { speechLang, type Lang } from "@/lib/i18n";

export async function speechLangFor(lang: Lang): Promise<Lang> {
  const wanted = speechLang(lang);
  if (wanted === "en") return wanted;
  return pickVoice(await loadVoices(), wanted) ? wanted : "en";
}
