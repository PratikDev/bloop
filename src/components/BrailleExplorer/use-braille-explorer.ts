"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { layout, nearestPoint } from "@/a11y/brailleShape";
import { bnScaleHeading, cellsOf, scaleHeading, SHAPE_MODE_LABELS, type BrailleSource, type ShapeMode } from "@/a11y/brailleSource";
import { readingLine, type BrailleLang } from "@/a11y/brailleLines";
import { useBrailleSettings } from "@/hooks/use-braille-settings";
import { audio } from "@/lib/audio-adapter";
import { isLetter, isTypingTarget } from "@/a11y/keys";
import { pushEscapeHandler } from "@/lib/escape";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState, useT } from "../AppState/use-app-state";

type ShapeField = HTMLTextAreaElement | HTMLInputElement;

const LEVEL_MS = 150;

/** RMS of the sound output now, 0..1 (0 when audio isn't running): the explorer's data-level, for tests and helpers. */
function outputLevel(): number {
  const analyser = audio.getAnalyser();
  if (!analyser) return 0;
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  return Math.sqrt(buf.reduce((s, x) => s + x * x, 0) / buf.length);
}

/**
 * One shared cursor for braille, text and sound: the shape line's caret is the needle. Moving the caret
 * (arrows, Home/End, a click or a display's routing key) moves the needle to that cell's point, so the
 * sound and the value line follow; a needle moved elsewhere moves the caret.
 */
export function useBrailleExplorer(source: BrailleSource, onClose: () => void) {
  const t = useT();
  const { state } = useAppState();
  // বাংলা mode writes the braille lines for the Bengali table (brailleBangla.ts); English mode for UEB.
  const lang: BrailleLang = state.lang === "bn" ? "bn" : "en";
  const announce = useAnnounce();
  const [settings, updateSettings] = useBrailleSettings();
  const [channel, setChannel] = useState(source.channels[0]?.id ?? "");
  const [chosenMode, setChosenMode] = useState<ShapeMode | null>(null);
  const [review, setReview] = useState(false);
  const [level, setLevel] = useState(0);
  const fieldRef = useRef<ShapeField | null>(null);
  const lastOffset = useRef(0);

  const modes = source.modes(channel);
  const mode = chosenMode && modes.includes(chosenMode) ? chosenMode : modes[0];
  const scale = source.scale(channel);
  const view = source.view(channel, mode);
  const heading = lang === "bn" ? bnScaleHeading(scale, source.relative)
    : scaleHeading(scale, settings.degree, t(source.relative ? "braille.relativeScale" : "braille.scale"));
  // Rebuilt each render: a few hundred cells at most.
  const shape = view ? layout(cellsOf(view, scale), settings.width, heading, settings.field === "textarea") : null;
  const valueLine = readingLine(t, source.reading(channel, mode), lang, settings.degree, review);

  const { prepare } = source;
  useEffect(() => prepare?.(channel, mode), [prepare, channel, mode]);

  // Opening (B or the button) puts the reader on the shape line.
  useEffect(() => fieldRef.current?.focus(), []);

  // Esc closes the explorer before it stops the sound.
  useEffect(
    () =>
      pushEscapeHandler(() => {
        onClose();
        return true;
      }),
    [onClose],
  );

  // The caret goes to the needle's cell: when the needle moved elsewhere (map keys, a click), keyed on the offset
  // alone so a re-render between a key press and its select event never snaps the caret back; and on arriving at
  // the shape line, because Chromium resets an unfocused field's caret to the start when its line is replaced
  // (another shape mode or voice), so the first arrow jumped the needle to the far end of the line (found by the
  // health app check). A click still places the caret where it lands: the browser sets it after the focus event.
  const target = shape && view ? shape.offsetOf(view.current) : null;
  const placeCaret = useCallback(() => {
    const el = fieldRef.current;
    if (!el || target === null || el.selectionStart === target) return;
    el.setSelectionRange(target, target);
    lastOffset.current = target;
  }, [target]);
  useEffect(placeCaret, [placeCaret]);

  const onCaret = useCallback(() => {
    const el = fieldRef.current;
    if (!el || !shape || !view) return;
    const off = el.selectionStart ?? 0;
    const direction = off > lastOffset.current ? "forward" : off < lastOffset.current ? "back" : undefined;
    const p = nearestPoint(shape, off, shape.text.length, direction);
    if (p === null) return;
    const snapped = shape.offsetOf(p);
    if (snapped !== off) el.setSelectionRange(snapped, snapped);
    lastOffset.current = snapped;
    if (p !== view.current && view.points[p]) {
      source.go(channel, mode, view.points[p]);
      setTimeout(() => setLevel(outputLevel()), LEVEL_MS);
    }
  }, [shape, view, source, channel, mode]);

  const setField = useCallback((el: ShapeField | null) => {
    fieldRef.current = el;
  }, []);

  // The shape line is a real text field (so arrows, Home/End and routing keys move a caret: a read-only field's
  // caret doesn't move with the keys in Chromium), marked aria-readonly, with every edit blocked here.
  const blockEdit = useCallback((e: { preventDefault(): void }) => e.preventDefault(), []);
  const blockEditKeys = useCallback((e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Backspace" || e.key === "Delete" || e.key === "Enter") e.preventDefault();
  }, []);

  // The value line: no text selected on focus (NVDA would mark every cell with dots 7-8) and the caret at the start,
  // so a 40-cell display shows the front of the line; the caret then moves with arrows, Home and End.
  const onValueFocus = useCallback((e: { currentTarget: HTMLInputElement }) => {
    const el = e.currentTarget;
    requestAnimationFrame(() => el.setSelectionRange(0, 0));
  }, []);

  const toggleReview = useCallback(() => {
    setReview((r) => {
      announce(t(r ? "braille.reviewOff" : "braille.reviewOn"));
      return !r;
    });
  }, [announce, t]);

  const chooseMode = useCallback(
    (m: ShapeMode) => {
      setChosenMode(m);
      announce(t("braille.modeAnnounce", { mode: t(SHAPE_MODE_LABELS[m]) }));
    },
    [announce, t],
  );

  // R reviews; it never steals typing from a field that takes text (the shape and value lines are read-only).
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (!isLetter(e, "r") || isTypingTarget(e.target)) return;
      e.preventDefault();
      toggleReview();
    },
    [toggleReview],
  );

  return {
    settings,
    updateSettings,
    channel,
    setChannel,
    modes,
    mode,
    chooseMode,
    shape,
    valueLine,
    review,
    toggleReview,
    level,
    setField,
    lang,
    onCaret,
    placeCaret,
    onValueFocus,
    blockEdit,
    blockEditKeys,
    onKeyDown,
  };
}
