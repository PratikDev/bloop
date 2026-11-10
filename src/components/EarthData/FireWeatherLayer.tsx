"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import { classAt } from "@/lib/earth/class-grid";
import { FIRE_WEATHER_VOICE } from "@/lib/earth/classes";
import { fwiLine } from "@/lib/earth/fire-text";
import { loadFwi, nextDay } from "@/lib/earth/fwi";
import { createChordLayer } from "@/lib/earth/sound/chord-layer";
import { ensureDataAudio } from "@/lib/earth/sound/out";
import { FLAGS } from "@/lib/flags";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { AgeNote } from "../EarthRecords/AgeNote";
import { OnOffToggle } from "../OnOffToggle";

// P2a on Listen: tomorrow's fire weather as a layer at the needle. The switch is in the dock's Mixer (a layer you can
// switch on; no new dock button, no new key), the sound follows the cursor from ListenActions (mounted on Listen only).

let on = false;
const listeners = new Set<() => void>();
const store = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => on,
  set(v: boolean) {
    on = v;
    for (const l of listeners) l();
  },
};
const useLayerOn = () => useSyncExternalStore(store.subscribe, store.get, () => false);

const listen = (mode: string) => mode === "explore" || mode === "story";

/** The chord at the cursor while the layer is on and the sound plays (Listen only). Renders nothing. */
export function FireWeatherLayerSound() {
  const { state } = useAppState();
  const layerOn = useLayerOn();
  const active = FLAGS.dataFireWeather && layerOn && state.soundOn && state.playing && listen(state.mode);
  const { value: fwi } = useLoaded(loadFwi, FLAGS.dataFireWeather && layerOn);
  const chord = useRef<ReturnType<typeof createChordLayer> | null>(null);
  useEffect(() => {
    if (!FLAGS.dataFireWeather) return;
    chord.current ??= createChordLayer(FIRE_WEATHER_VOICE);
    if (!active || !fwi) {
      chord.current.stop();
      return;
    }
    // HOOK: orchestra (fire): the layer's chord (chord-layer.ts).
    chord.current.set(classAt(fwi, state.cursor.lat, state.cursor.lon), state.cursor.lon);
  }, [active, fwi, state.cursor]);
  useEffect(() => () => chord.current?.stop(), []);
  return null;
}

/** The switch and what it plays now, in the Mixer (Listen only). */
export function FireWeatherLayerControl() {
  const t = useT();
  const { state } = useAppState();
  const commands = useCommands();
  const layerOn = useLayerOn();
  const { value: fwi } = useLoaded(loadFwi, FLAGS.dataFireWeather && layerOn);
  if (!FLAGS.dataFireWeather || !listen(state.mode)) return null;
  const toggle = async (v: boolean) => {
    if (v) await ensureDataAudio();
    store.set(v);
    void commands.say((tt) => tt(v ? "earth.layer.on" : "earth.layer.off"));
  };
  return (
    <section className="space-y-1.5" aria-label={t("earth.layer.full")} data-testid="fire-layer">
      <div className="stitch-x opacity-60" aria-hidden="true" />
      <OnOffToggle label={t("earth.layer.switch")} on={layerOn} onChange={(v) => void toggle(v)} />
      <p className="text-small text-haze">{t("earth.fire.fwiLabel")}</p>
      {layerOn && !fwi && <p className="text-small text-haze">{t("earth.layer.loading")}</p>}
      {layerOn && fwi && (
        <>
          <p className="text-body" data-testid="fire-layer-reading" data-fwi-code={classAt(fwi, state.cursor.lat, state.cursor.lon)}>
            {fwiLine(t, state.lang, fwi.meta, { fwiCode: classAt(fwi, state.cursor.lat, state.cursor.lon), forDay: nextDay(fwi.meta.frame_time_utc.slice(0, 10)) })}
          </p>
          <AgeNote product={fwi.meta.product} sourceTime={fwi.meta.source_time_utc} />
        </>
      )}
    </section>
  );
}
