"use client";

import { Button } from "@/components/ui/button";
import { useLoaded } from "@/hooks/use-loaded";
import { loadNightLights } from "@/lib/earth/nightlights";
import { FLAGS } from "@/lib/flags";
import { useT } from "../../AppState/use-app-state";
import { WRAP_KEY } from "../../row-key";
import { preferCity } from "./use-night-lights";

/** Under SVS 5313 "Change in night lights": hear the measured radiance for Dhaka (if the file has Dhaka). */
export function LightsLink({ choose }: { choose: (record: string) => void }) {
  const t = useT();
  const { value: file } = useLoaded(loadNightLights, FLAGS.dataNightLights);
  const city = file && "Dhaka" in file.cities ? "Dhaka" : null;
  if (!FLAGS.dataNightLights || !city) return null;
  return (
    <Button
      variant="outline"
      className={WRAP_KEY}
      data-testid="lights-link"
      onClick={() => {
        preferCity(city);
        choose("nightlights_bm");
      }}
    >
      {t("earth.lights.hearDhaka", { city: t("data.text", { text: city }) })}
    </Button>
  );
}
