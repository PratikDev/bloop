import { useEffect, useState } from "react";
import { loadVoices } from "@/lib/audio/dev";

export interface VoiceRow {
  name: string;
  lang: string;
  localService: boolean;
}

/** The device's speech voices (they load asynchronously; the list updates when they arrive). */
export function useSpeechVoices() {
  const [voices, setVoices] = useState<VoiceRow[]>([]);

  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    const refresh = () =>
      loadVoices().then((list) =>
        setVoices(list.map(({ name, lang, localService }) => ({ name, lang, localService }))),
      );
    void refresh();
    speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => speechSynthesis.removeEventListener("voiceschanged", refresh);
  }, []);

  return voices;
}
