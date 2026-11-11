import { useState } from "react";
import { getLoudnessCompensation, playLoudnessSet, setLoudnessExponent } from "@/lib/audio/dev";

export const T3_FREQS = [220, 440, 880] as const;
export type T3Device = "headphones" | "phone";
export type T3Answer = "equal" | `${(typeof T3_FREQS)[number]}`;

export interface T3Result {
  exponent: number;
  device: T3Device;
  answer: T3Answer;
}

/** T3 state: the exponent being tried (applied to the page at once), playback, and the answers so far. */
export function useLoudnessTest() {
  const [exponent, setExponentState] = useState(() => getLoudnessCompensation().exponent);
  const [playing, setPlaying] = useState(false);
  const [results, setResults] = useState<T3Result[]>([]);

  const setExponent = (k: number) => {
    setLoudnessExponent(k);
    setExponentState(k);
  };

  const play = (freqs: readonly number[]) => {
    setPlaying(true);
    const sec = playLoudnessSet([...freqs]);
    setTimeout(() => setPlaying(false), sec * 1000);
  };

  const record = (device: T3Device, answer: T3Answer) => setResults((r) => [...r, { exponent, device, answer }]);

  return { exponent, setExponent, playing, play, results, record, clear: () => setResults([]) };
}

/** Gain in dB that the compensation gives `freq` at `exponent` (0 dB = the reference pitch). */
export function compensationDb(freq: number, exponent: number): number {
  const { refHz } = getLoudnessCompensation();
  return 20 * exponent * Math.log10(refHz / freq);
}
