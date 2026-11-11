"use client";

import { useArtSettings } from "@/hooks/use-art-settings";
import { STYLES } from "@/lib/art/settings";
import { FLAGS } from "@/lib/flags";
import { useT } from "../AppState/use-app-state";
import { ChoiceGroup } from "../ChoiceGroup";
import { ArtDial } from "./Dial";

/** Settings: Instrument style (Earth Orchestra / Plain tones) and the Science to Art dial, each behind its flag. */
export function ArtSettings() {
  const t = useT();
  const [art, setArt] = useArtSettings();
  if (!FLAGS.artOrchestra && !FLAGS.artDial) return null;
  return (
    <div className="space-y-3" data-testid="art-settings">
      {FLAGS.artOrchestra && (
        <>
          <ChoiceGroup
            showLabel
            label={t("orchestra.style")}
            className="w-full"
            itemClassName="flex-1"
            value={art.style}
            onChange={(style) => setArt({ style })}
            options={STYLES.map((value) => ({ value, label: t(`orchestra.style.${value}`) }))}
          />
          <p className="px-1 text-small text-haze">{t("orchestra.style.note")}</p>
        </>
      )}
      <ArtDial />
    </div>
  );
}
