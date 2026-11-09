"use client";

import { useTT } from "../../Turntable/i18n";
import { SceneShell } from ".";

/** A scene's frame while its records load (or if they fail): title, Back, and a status line. */
export function SceneLoading({ title, how, error, onExit }: { title: string; how: string; error: boolean; onExit(): void }) {
  const { tt } = useTT();
  return (
    <SceneShell
      title={title}
      entry={tt("scenes.entry", { scene: title, how })}
      onExit={onExit}
      onKey={() => false}
      onDetails={() => undefined}
      stage={
        <p role="status" className="absolute inset-x-0 top-1/2 text-center text-body text-haze">
          {tt(error ? "scenes.failed" : "scenes.loading")}
        </p>
      }
      legend={null}
      disclosure={[tt("scenes.context")]}
      dock={{ playing: false, onPlay: () => undefined, speedText: "—", onSpeed: () => undefined }}
      layers={null}
    />
  );
}
