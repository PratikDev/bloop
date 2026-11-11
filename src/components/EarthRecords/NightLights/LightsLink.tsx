"use client";

import { Button } from "@/components/ui/button";
import { useLoaded } from "@/hooks/use-loaded";
import { loadNightLights } from "@/lib/earth/nightlights";
import { FLAGS } from "@/lib/flags";
import { useT } from "../../AppState/use-app-state";
import { preferCity } from "./use-night-lights";

export function LightsLink({ choose }: { choose: (record: string) => void }) {
  const t = useT();
  const { value: file } = useLoaded(loadNightLights, FLAGS.dataNightLights);
  const city = file && "Dhaka" in file.cities ? "Dhaka" : null;
  if (!FLAGS.dataNightLights || !city) return null;
  return (
    <Button
      variant="outline"
      className="h-auto min-h-11 rounded-full px-4 py-2 text-left text-body whitespace-normal"
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
