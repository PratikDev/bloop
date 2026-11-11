"use client";

import { CaretDown, X } from "@phosphor-icons/react";
import { brailleRole } from "@/a11y/aria";
import dynamic from "next/dynamic";
import { useId, useState, type ReactNode } from "react";
import { SHAPE_MODE_LABELS, type BrailleSource } from "@/a11y/brailleSource";
import { Button } from "@/components/ui/button";
import { BRAILLE_WIDTHS } from "@/hooks/use-braille-settings";
import { formatInteger } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { OnOffToggle } from "../OnOffToggle";
import { RadioChoiceGroup } from "../RadioChoiceGroup";
import { ROW_KEY } from "../row-key";
import { useBrailleExplorer } from "./use-braille-explorer";

// The visual preview loads only when it is switched on.
const BraillePreview = dynamic(() => import("./BraillePreview").then((m) => m.BraillePreview), { ssr: false });

export const BRAILLE_EXPLORER_ID = "braille-explorer";

/** The two lines are real text fields: a navy outline on paper, so they read as fields inside the one panel. */
const FIELD = "w-full rounded-lg border-2 border-navy bg-paper px-3 py-2 text-body text-moon";

/**
 * The Braille Data Explorer (docs/accessibility/BRAILLE.md): a value line that stays on the display (a
 * field, not a flash message) and a shape line holding the data as 8-dot braille, whose caret is the needle.
 */
export function BrailleExplorer({ source, onClose, className }: { source: BrailleSource; onClose: () => void; className?: string }) {
  const t = useT();
  const { settings, updateSettings, scale, view, channel, setChannel, modes, mode, chooseMode, shape, valueLine, review, toggleReview, level, setField, lang,
    onCaret, placeCaret, onValueFocus, blockEdit, blockEditKeys, onKeyDown } = useBrailleExplorer(source, onClose);
  const headingId = useId();
  const helpId = useId();
  const valueId = useId();
  const shapeId = useId();
  const dotsHintId = useId();
  const lines = shape ? shape.text.split("\n").length : 1;
  // Both lines are real text fields, so the caret moves with arrows, Home, End and routing keys (a read-only
  // field's caret doesn't, in Chromium), marked aria-readonly with every edit blocked.
  const readOnlyField = {
    "aria-readonly": true,
    inputMode: "none" as const,
    onChange: () => {},
    onBeforeInput: blockEdit,
    onPaste: blockEdit,
    onCut: blockEdit,
    onDrop: blockEdit,
    onKeyDown: blockEditKeys,
    spellCheck: false,
    lang: lang === "bn" ? "bn" : undefined,
  };
  const shapeProps = {
    ...readOnlyField,
    id: shapeId,
    value: shape?.text ?? t("braille.loading"),
    "aria-describedby": helpId,
    "aria-roledescription": t("braille.shapeRole"),
    ...brailleRole(t("braille.bl.shape")),
    onSelect: onCaret,
    onFocus: placeCaret,
    "data-testid": "braille-shape",
    // Braille cells at 30 px, so a sighted helper can read the shape; the lines wrap inside the field, never sideways.
    className: cn(FIELD, "braille-cells resize-none overflow-x-hidden font-mono leading-snug tracking-normal break-all whitespace-pre-wrap"),
  };

  const settingsOpen = useDisclosure();
  const howTo = useDisclosure();

  return (
    <section
      id={BRAILLE_EXPLORER_ID}
      aria-labelledby={headingId}
      onKeyDown={onKeyDown}
      data-level={level.toFixed(4)}
      data-mode={mode}
      // For the braille consistency checks (e2e/braille.e2e.ts): the shared scale, and the needle's point on the line.
      data-scale={`${scale.min},${scale.max},${scale.scale}`}
      data-index={view?.current}
      data-point={view?.points[view.current] ? `${view.points[view.current].at.lat},${view.points[view.current].at.lon}` : undefined}
      className={cn("slab space-y-6 p-5", className)}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h2 id={headingId} className="font-wide text-title">
            {t("braille.heading")}
          </h2>
          <Button variant="ghost" onClick={onClose} aria-label={t("braille.close")} className="key border-navy size-11 shrink-0 rounded-lg bg-paper text-moon hover:bg-paper">
            <X aria-hidden="true" className="size-5" />
          </Button>
        </div>
        <p className="text-body text-haze">{t("braille.instructions.short")}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor={valueId} className="block text-body font-medium text-moon">
          {t("braille.valueLine")}
        </label>
        <input {...readOnlyField} id={valueId} value={valueLine} onFocus={onValueFocus} data-testid="braille-value" className={cn(FIELD, "readout-figure text-lead")} />
      </div>

      <div className="space-y-2">
        <label htmlFor={shapeId} className="block text-body font-medium text-moon">
          {t("braille.shapeLine")}
        </label>
        {settings.field === "textarea" ? (
          <textarea {...shapeProps} ref={setField} rows={Math.min(lines, 6)} cols={settings.width} wrap="soft" />
        ) : (
          <input {...shapeProps} ref={setField} />
        )}
      </div>

      <Button variant="ghost" onClick={toggleReview} aria-pressed={review} className={ROW_KEY}>
        {t("braille.review")}
      </Button>

      <Disclosure label={t("braille.howTo")} state={howTo}>
        <p id={helpId} className="text-body text-moon">
          {t("braille.instructions")}
        </p>
      </Disclosure>

      <Disclosure label={t("braille.settings")} state={settingsOpen}>
        <div className="space-y-6">
          {source.channels.length > 1 && (
            <RadioChoiceGroup label={t("braille.channel")} value={channel} onChange={setChannel} options={source.channels.map((c) => ({ value: c.id, label: c.label }))} />
          )}
          {modes.length > 1 && (
            <RadioChoiceGroup label={t("braille.mode")} value={mode} onChange={chooseMode} options={modes.map((m) => ({ value: m, label: t(SHAPE_MODE_LABELS[m]) }))} />
          )}
          <RadioChoiceGroup
            label={t("braille.width")}
            value={String(settings.width)}
            onChange={(w) => updateSettings({ width: Number(w) as (typeof BRAILLE_WIDTHS)[number] })}
            options={BRAILLE_WIDTHS.map((w) => ({ value: String(w), label: formatInteger(w, lang) }))}
          />
          <RadioChoiceGroup
            label={t("braille.field")}
            hint={t("braille.field.hint")}
            value={settings.field}
            onChange={(field) => updateSettings({ field })}
            options={[
              { value: "textarea", label: t("braille.field.textarea") },
              { value: "input", label: t("braille.field.input") },
            ]}
          />
          <RadioChoiceGroup
            label={t("braille.degree")}
            hint={t("braille.degree.hint")}
            value={settings.degree}
            onChange={(degree) => updateSettings({ degree })}
            options={[
              { value: "word", label: t("braille.degree.word") },
              { value: "symbol", label: t("braille.degree.symbol") },
            ]}
          />
          <div className="space-y-1">
            <OnOffToggle
              label={t("braille.preview")}
              on={settings.preview}
              onChange={(preview) => updateSettings({ preview })}
              stateText={{ on: t("braille.on"), off: t("braille.off") }}
              describedBy={dotsHintId}
              className="h-11 gap-3 rounded-lg border-2 border-navy bg-paper px-3 text-body font-medium aria-pressed:bg-paper"
            />
            <p id={dotsHintId} className="px-1 text-small text-haze">
              {t("braille.preview.hint")}
            </p>
          </div>
          {settings.preview && shape && <BraillePreview text={shape.text} />}
        </div>
      </Disclosure>
    </section>
  );
}

/** Open or closed, for one Disclosure. */
function useDisclosure() {
  const [open, setOpen] = useState(false);
  return { open, toggle: () => setOpen((o) => !o) };
}

/** A section behind a key that says whether it is open (aria-expanded); the content is in the page, not a popup. */
function Disclosure({ label, state, children }: { label: string; state: ReturnType<typeof useDisclosure>; children: ReactNode }) {
  const contentId = useId();
  return (
    <div className="space-y-4">
      <Button variant="ghost" aria-expanded={state.open} aria-controls={contentId} onClick={state.toggle} className={cn(ROW_KEY, "w-full justify-between")}>
        {label}
        <CaretDown aria-hidden="true" className={cn("size-4 transition-transform", state.open && "rotate-180")} />
      </Button>
      <div id={contentId} hidden={!state.open}>
        {children}
      </div>
    </div>
  );
}
