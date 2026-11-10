"use client";

import { X } from "@phosphor-icons/react";
import { brailleRole } from "@/a11y/aria";
import dynamic from "next/dynamic";
import { useId } from "react";
import { SHAPE_MODE_LABELS, type BrailleSource } from "@/a11y/brailleSource";
import { Button } from "@/components/ui/button";
import { BRAILLE_WIDTHS } from "@/hooks/use-braille-settings";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { ChoiceGroup } from "../ChoiceGroup";
import { OnOffToggle } from "../OnOffToggle";
import { useBrailleExplorer } from "./use-braille-explorer";

// The visual preview loads only when it is switched on.
const BraillePreview = dynamic(() => import("./BraillePreview").then((m) => m.BraillePreview), { ssr: false });

export const BRAILLE_EXPLORER_ID = "braille-explorer";

const FIELD = "w-full rounded-md border border-line bg-night px-3 py-2 text-body text-moon focus-visible:outline-2 focus-visible:outline-amber";

/**
 * The Braille Data Explorer (docs/accessibility/BRAILLE.md): a value line that stays on the display (a
 * field, not a flash message) and a shape line holding the data as 8-dot braille, whose caret is the needle.
 */
export function BrailleExplorer({ source, onClose, className }: { source: BrailleSource; onClose: () => void; className?: string }) {
  const t = useT();
  const { settings, updateSettings, channel, setChannel, modes, mode, chooseMode, shape, valueLine, review, toggleReview, level, setField, lang,
    onCaret, placeCaret, onValueFocus, blockEdit, blockEditKeys, onKeyDown } = useBrailleExplorer(source, onClose);
  const headingId = useId();
  const helpId = useId();
  const valueId = useId();
  const shapeId = useId();
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
    className: cn(FIELD, "font-mono leading-snug tracking-normal"),
  };

  return (
    <section
      id={BRAILLE_EXPLORER_ID}
      aria-labelledby={headingId}
      onKeyDown={onKeyDown}
      data-level={level.toFixed(4)}
      data-mode={mode}
      className={cn("space-y-3 rounded-lg border border-line bg-dusk p-4", className)}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 id={headingId} className="text-lead font-medium">
          {t("braille.heading")}
        </h2>
        <Button variant="ghost" size="icon-lg" onClick={onClose} aria-label={t("braille.close")} className="size-11">
          <X aria-hidden="true" />
        </Button>
      </div>
      <p id={helpId} className="text-small text-haze">
        {t("braille.instructions")}
      </p>

      <div className="space-y-1">
        <label htmlFor={valueId} className="text-small text-haze">
          {t("braille.valueLine")}
        </label>
        <input {...readOnlyField} id={valueId} value={valueLine} onFocus={onValueFocus} data-testid="braille-value" className={FIELD} />
      </div>

      <div className="space-y-1">
        <label htmlFor={shapeId} className="text-small text-haze">
          {t("braille.shapeLine")}
        </label>
        {settings.field === "textarea" ? (
          <textarea {...shapeProps} ref={setField} rows={Math.min(lines, 8)} cols={settings.width} />
        ) : (
          <input {...shapeProps} ref={setField} />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={toggleReview} aria-pressed={review} className="h-11">
          {t("braille.review")}
        </Button>
      </div>

      {source.channels.length > 1 && (
        <ChoiceGroup label={t("braille.channel")} value={channel} onChange={setChannel}
          options={source.channels.map((c) => ({ value: c.id, label: c.label }))} />
      )}
      {modes.length > 1 && (
        <ChoiceGroup label={t("braille.mode")} value={mode} onChange={chooseMode} className="flex-wrap"
          options={modes.map((m) => ({ value: m, label: t(SHAPE_MODE_LABELS[m]) }))} />
      )}
      <ChoiceGroup label={t("braille.width")} value={String(settings.width)} className="flex-wrap"
        onChange={(w) => updateSettings({ width: Number(w) as (typeof BRAILLE_WIDTHS)[number] })}
        options={BRAILLE_WIDTHS.map((w) => ({ value: String(w), label: String(w) }))} />
      <ChoiceGroup label={t("braille.field")} value={settings.field} onChange={(field) => updateSettings({ field })}
        options={[{ value: "textarea", label: t("braille.field.textarea") }, { value: "input", label: t("braille.field.input") }]} />
      <ChoiceGroup label={t("braille.degree")} value={settings.degree} onChange={(degree) => updateSettings({ degree })}
        options={[{ value: "word", label: t("braille.degree.word") }, { value: "symbol", label: t("braille.degree.symbol") }]} />
      <OnOffToggle label={t("braille.preview")} on={settings.preview} onChange={(preview) => updateSettings({ preview })}
        className="h-11 justify-between gap-3 px-3 text-body aria-pressed:bg-tide" />
      {settings.preview && shape && <BraillePreview text={shape.text} />}
    </section>
  );
}
