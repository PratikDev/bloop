"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import { stopAllEngines } from "@/lib/audio-engines";
import type { PlayerHandle } from "@/lib/audio-jukebox/types";
import { loadCities, loadGlobalPlaces, loadSstPairs } from "@/lib/data";
import { rainAt } from "@/lib/data/latest";
import { downloadBlob } from "@/lib/download";
import { exportName, resultsFile, type TaskResult } from "@/lib/listen-test/results";
import { buildTasks, referenceC, type OptionId, type SoundPlan, type Task, type TaskInputs } from "@/lib/listen-test/tasks";
import { useAppState } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { useLiveData } from "../../LiveData/use-live-data";
import { playPlan, playScale } from "./play";

export type Step =
  | { kind: "consent" }
  | { kind: "age" }
  | { kind: "ended" }
  | { kind: "stopped" }
  | { kind: "intro" }
  | { kind: "task"; index: number }
  | { kind: "comment" }
  | { kind: "done" };

/** The heat task's city: Dhaka, the app's default (its record is the cross-checked one). */
const HEAT_CITY = "Dhaka";

const loadInputs = async (): Promise<Omit<TaskInputs, "rainAt">> => {
  const [pairs, places, cities] = await Promise.all([loadSstPairs(), loadGlobalPlaces(), loadCities()]);
  const city = cities.cities.find((c) => c.name === HEAT_CITY);
  if (!city) throw new Error(`cities_then_now.json has no ${HEAT_CITY}`);
  return { pairs: pairs.pairs, places: places.places, heat: { place: city.name, A: city.heat.A, B: city.heat.B } };
};

/** The test's steps, its tasks (answers from the data), the answers so far (in memory only) and the sound. */
export function useListenTest() {
  const { state } = useAppState();
  const commands = useCommands();
  const { rain, rainStatus } = useLiveData();
  const inputs = useLoaded(loadInputs);
  const tasks: Task[] | null = useMemo(
    () => (inputs.value && rain ? buildTasks({ ...inputs.value, rainAt: (lat, lon) => rainAt(rain, lat, lon) }) : null),
    [inputs.value, rain],
  );
  const [step, setStep] = useState<Step>({ kind: "consent" });
  const [comment, setComment] = useState("");
  const results = useRef<TaskResult[]>([]);
  const shownAt = useRef(0);
  const player = useRef<PlayerHandle | null>(null);

  const silence = useCallback(() => {
    player.current?.stop();
    player.current = null;
    stopAllEngines();
  }, []);

  const go = useCallback(
    (next: Step) => {
      silence();
      if (next.kind === "task") shownAt.current = performance.now();
      setStep(next);
    },
    [silence],
  );

  const play = useCallback(
    async (plan: SoundPlan | "scale") => {
      if (!state.soundOn) await commands.enableSound();
      silence();
      player.current = plan === "scale" ? playScale() : playPlan(plan);
    },
    [state.soundOn, commands, silence],
  );

  const answer = (task: Task, option: OptionId, index: number) => {
    results.current.push({ task: task.id, answer: option, correct_answer: task.correct, correct: option === task.correct, ms: Math.round(performance.now() - shownAt.current) });
    go(tasks && index + 1 < tasks.length ? { kind: "task", index: index + 1 } : { kind: "comment" });
  };

  const stop = () => {
    results.current = [];
    go({ kind: "stopped" });
  };

  const exportResults = () =>
    downloadBlob(new Blob([JSON.stringify(resultsFile(state.lang, results.current, comment), null, 1)], { type: "application/json" }), exportName(new Date()));

  const reference = inputs.value ? referenceC(inputs.value.pairs) : null;
  const error = inputs.error || rainStatus === "error";
  return { step, go, tasks, error, reference, play, answer, stop, comment, setComment, exportResults };
}
