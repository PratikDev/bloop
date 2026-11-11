"use client";

import { downloadBlob } from "@/lib/download";
import { FLAGS } from "@/lib/flags";
import { sidecarText, stlHeader, tactileAlt } from "@/lib/tactile-alt";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState, useT } from "../AppState/use-app-state";
import { downloadTactileRecord, tactileAltInput, type TactileMeta, type TactileRecord } from "./tactile";

const TEXT = "text/plain;charset=utf-8";

/**
 * The tactile disc's two saves: the STL, with its alt text in the header, and the alt
 * text and extended description as a sidecar .txt of the same name. Each is its own button, so no download happens
 * without a press. With the step's flag off, the STL is saved as before and there is no sidecar.
 */
export function useTactileExport() {
  const { state } = useAppState();
  const t = useT();
  const announce = useAnnounce();
  const altOf = (rec: TactileRecord, meta: TactileMeta) => tactileAlt(t, state.lang, tactileAltInput(rec, meta));
  return {
    saveStl(rec: TactileRecord, meta: TactileMeta, file: string) {
      downloadTactileRecord(rec, file, FLAGS.timedText ? stlHeader(tactileAlt(t, "en", tactileAltInput(rec, meta)).alt) : undefined);
    },
    /** The sidecar (null with the flag off: no button). */
    saveAlt: FLAGS.timedText
      ? (rec: TactileRecord, meta: TactileMeta, stlFile: string) => {
          const file = stlFile.replace(/\.stl$/, ".txt");
          downloadBlob(new Blob([sidecarText(t, altOf(rec, meta))], { type: TEXT }), file);
          announce(t("alt.saved", { file }));
        }
      : null,
  };
}
