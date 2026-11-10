"use client";

import { useEffect, useRef, type RefObject } from "react";
import { LIVE_VOICES } from "@/lib/audio-adapter/types";
import { useAppState } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { SPEEDS } from "../use-turntable";
import type { DeckView } from "./deck-view";
import type { HardwareId } from "./hardware";

/** The DOM controls' own actions and state, which the hardware mirrors (the Turntable's bar and More). */
export interface DeckControls {
  rotating: boolean;
  speed: number;
  /** The bar's Turn / Stop turning key. */
  toggleRotation(): void;
  /** More › Speed's Slower / Faster. */
  changeSpeed(step: 1 | -1): void;
}

/** The switch's two speeds: 33 is the usual turning speed, 45 the next one up (SPEEDS in use-turntable.ts). */
export const SPEED_33 = 1;
export const SPEED_45 = 2;
/** A finger needs this much to tap a piece; smaller pieces are visual only on touch screens (the DOM controls work). */
const MIN_TAP_PX = 44;
/** Dragging the knob this far sideways turns it from silent to full. */
const KNOB_DRAG_PX = 160;
/** A press that moves less than this is a click (a click on the knob steps the volume by a quarter). */
const CLICK_SLOP_PX = 4;
const KNOB_STEP = 0.25;

const voicesVolume = (mix: Record<(typeof LIVE_VOICES)[number], { volume: number }>) => Math.max(...LIVE_VOICES.map((v) => mix[v].volume));

/**
 * The hardware shows its DOM controls' state and does what they do: the start/stop button turns the Earth, the 33/45
 * switch sets the speed, the cue lever pauses or plays the sound, the knob sets the voices' volume (all of them, as one).
 * Clicks on the hardware never reach the record: the handler stops them.
 */
export function useDeckHardware(view: DeckView | null, canvasRef: RefObject<HTMLCanvasElement | null>, controls: DeckControls): void {
  const { state, dispatch } = useAppState();
  const commands = useCommands();
  const volume = voicesVolume(state.mix);
  const paused = !(state.soundOn && state.playing);

  useEffect(() => {
    view?.setHardware({ rotating: controls.rotating, fast: controls.speed > SPEED_33, paused, volume });
  }, [view, controls.rotating, controls.speed, paused, volume]);

  const latest = useRef({ controls, commands, volume, dispatch });
  useEffect(() => {
    latest.current = { controls, commands, volume, dispatch };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!view || !canvas) return;
    const coarse = window.matchMedia("(pointer: coarse)");
    const setVolume = (v: number) => {
      const next = Math.min(1, Math.max(0, v));
      for (const voice of LIVE_VOICES) latest.current.dispatch({ type: "setVoiceMix", voice, mix: { volume: next } });
    };
    const act = (id: HardwareId) => {
      const { controls: c, commands: cmd } = latest.current;
      if (id === "start") c.toggleRotation();
      else if (id === "cue") cmd.togglePlaying();
      else if (id === "speed") {
        const from = SPEEDS.findIndex((s) => s >= c.speed - 1e-6);
        const to = SPEEDS.indexOf(c.speed > SPEED_33 ? SPEED_33 : SPEED_45);
        for (let i = from; i !== to; i += Math.sign(to - from)) c.changeSpeed(Math.sign(to - from) as 1 | -1);
      }
    };
    let knob: { id: number; x: number; v: number; moved: boolean } | null = null;
    const at = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      return { x: e.clientX - box.left, y: e.clientY - box.top };
    };
    const hit = (e: PointerEvent): HardwareId | null => {
      const p = at(e);
      const id = view.hardwareAt(p.x, p.y);
      if (!id) return null;
      return coarse.matches && view.hardwareSize(id) < MIN_TAP_PX ? null : id;
    };
    const down = (e: PointerEvent) => {
      const id = hit(e);
      if (!id) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (id === "volume") {
        canvas.setPointerCapture(e.pointerId);
        knob = { id: e.pointerId, x: e.clientX, v: latest.current.volume, moved: false };
      } else act(id);
    };
    const move = (e: PointerEvent) => {
      if (knob && e.pointerId === knob.id) {
        const dx = e.clientX - knob.x;
        if (Math.abs(dx) > CLICK_SLOP_PX) knob.moved = true;
        if (knob.moved) setVolume(knob.v + dx / KNOB_DRAG_PX);
        e.stopImmediatePropagation();
        return;
      }
      if (e.pointerType === "mouse") canvas.style.cursor = hit(e) ? "pointer" : "";
    };
    const up = (e: PointerEvent) => {
      if (!knob || e.pointerId !== knob.id) return;
      if (!knob.moved) setVolume(knob.v >= 1 ? 0 : knob.v + KNOB_STEP);
      knob = null;
      e.stopImmediatePropagation();
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [view, canvasRef]);
}
