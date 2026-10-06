// Bangla strings: every key the English has (each file is typed against its
// English twin, so a missing key fails the type check). Data-file prose is
// translated in data.ts.

import type { Messages } from "../index";
import { appBn } from "./app";
import { captionsBn } from "./captions";
import { contextBn } from "./context";
import { helpBn } from "./help";
import { pagesBn } from "./pages";
import { panelsBn } from "./panels";
import { storyBn } from "./story";

export const bn: Messages = { ...appBn, ...helpBn, ...captionsBn, ...panelsBn, ...contextBn, ...storyBn, ...pagesBn };

/**
 * Spoken lines (Enter, the tour, Describe) are translated, so speech follows
 * the screen when the device has a Bangla voice; without one, speech stays
 * English with Bangla on screen (plan §17), see src/lib/speech-lang.ts.
 */
export const BANGLA_SPEECH_READY = true;
