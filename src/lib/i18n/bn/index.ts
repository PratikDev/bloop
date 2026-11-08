// Bangla strings: the keys translated so far. Each file is typed against its
// English twin's keys (no key that English lacks); a key not translated yet
// shows in English and is listed in docs/i18n/TO_TRANSLATE.md. Data-file prose
// is translated in data.ts.

import type { Messages } from "../index";
import { appBn } from "./app";
import { captionsBn } from "./captions";
import { contextBn } from "./context";
import { creditsBn } from "./credits";
import { provenanceBn } from "./provenance";
import { teamBn } from "./team";
import { listenTestBn } from "./listen-test";
import { accessBn } from "./access";
import { describeBn } from "./describe";
import { helpBn } from "./help";
import { pagesBn } from "./pages";
import { panelsBn } from "./panels";
import { framesBn } from "./frames";
import { howBn } from "./how";
import { statsBn } from "./stats";
import { storyBn } from "./story";

export const bn: Partial<Messages> = { ...appBn, ...helpBn, ...captionsBn, ...panelsBn, ...contextBn, ...storyBn, ...pagesBn, ...statsBn, ...framesBn, ...howBn, ...creditsBn, ...provenanceBn, ...teamBn, ...listenTestBn, ...accessBn, ...describeBn };

/**
 * Spoken lines (Enter, the tour, Describe) are translated, so speech follows
 * the screen when the device has a Bangla voice; without one, speech stays
 * English with Bangla on screen (plan §17), see src/lib/speech-lang.ts.
 */
export const BANGLA_SPEECH_READY = true;
