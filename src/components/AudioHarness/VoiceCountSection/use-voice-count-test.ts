import { useRef, useState } from "react";
import type { PlayerHandle } from "@/lib/audio";
import { playT7, T7_VOICES, type T7Voice } from "@/lib/audio/dev";

export const T7_TRIALS = 10;
export const T7_PASS = 8;

function randomSet(count: number): T7Voice[] {
  const shuffled = [...T7_VOICES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const sameSet = (a: readonly T7Voice[], b: readonly T7Voice[]) => a.length === b.length && a.every((v) => b.includes(v));

/** T7 state for one listener at one voice count: the hidden set, the guess, and the score. */
export function useVoiceCountTest() {
  const [count, setCountState] = useState(3);
  const [target, setTarget] = useState<T7Voice[] | null>(null);
  const [guess, setGuess] = useState<T7Voice[]>([]);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [last, setLast] = useState<string | null>(null);
  const handle = useRef<PlayerHandle | null>(null);
  const done = answered >= T7_TRIALS;

  const restart = (n = count) => {
    handle.current?.stop();
    setCountState(n);
    setTarget(null);
    setGuess([]);
    setAnswered(0);
    setCorrect(0);
    setLast(null);
  };

  const play = () => {
    const set = target ?? randomSet(count);
    setTarget(set);
    handle.current?.stop();
    handle.current = playT7(set);
  };

  const submit = () => {
    if (!target) return;
    handle.current?.stop();
    const right = sameSet(guess, target);
    setAnswered((n) => n + 1);
    if (right) setCorrect((n) => n + 1);
    setLast(right ? "Correct" : `Wrong: it was ${target.join(" + ")}`);
    setTarget(null);
    setGuess([]);
  };

  return { count, setCount: restart, target, guess, setGuess, answered, correct, last, done, play, submit, restart };
}
