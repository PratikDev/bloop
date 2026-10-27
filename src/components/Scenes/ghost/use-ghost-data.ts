"use client";

import { useEffect, useState } from "react";
import { loadDemo, loadGrace } from "@/lib/data";
import { loadGlobalConfidence, loadGlobalLayer, loadGlobalManifest, loadGlobalPlaces } from "@/lib/data/global";
import type { GlobalConfidenceFile, GlobalLayerName, GlobalManifest, GlobalPlacesFile } from "@/types/data-contract";
import { buildField, ghostWindows, type GhostField, type GhostWindows } from "./fields";

export interface GhostFiles {
  windows: GhostWindows;
  places: GlobalPlacesFile;
  confidence: GlobalConfidenceFile;
  manifest: GlobalManifest;
}

export interface GhostData {
  files: GhostFiles | null;
  /** The chosen layer's then and now fields (null while loading). */
  field: GhostField | null;
  error: boolean;
}

/** Loads the cube's small files once, then each layer's cube when it is first chosen (cached). */
export function useGhostData(layer: GlobalLayerName): GhostData {
  const [files, setFiles] = useState<GhostFiles | null>(null);
  const [fields, setFields] = useState<Partial<Record<GlobalLayerName, GhostField>>>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadDemo(), loadGrace(), loadGlobalPlaces(), loadGlobalConfidence(), loadGlobalManifest()])
      .then(([demo, grace, places, confidence, manifest]) => {
        if (!cancelled) setFiles({ windows: ghostWindows(demo, grace), places, confidence, manifest });
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const loaded = fields[layer] !== undefined;
  useEffect(() => {
    if (!files || loaded) return;
    let cancelled = false;
    loadGlobalLayer(layer)
      .then((cube) => {
        if (!cancelled) setFields((f) => ({ ...f, [layer]: buildField(cube, files.windows[layer]) }));
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [files, layer, loaded]);

  return { files, field: fields[layer] ?? null, error };
}
