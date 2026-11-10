// Bangla strings: the keys translated so far. Each file is typed against its
// English twin's keys (no key that English lacks); a key not translated yet
// shows in English and is listed in docs/i18n/TO_TRANSLATE.md. Data-file prose
// is translated in data.ts.

import type { Messages } from "../index";
import { appBn } from "./app";
import { brailleBn } from "./braille";
import { captionsBn } from "./captions";
import { contextBn } from "./context";
import { helpBn } from "./help";
import { officialBn } from "./official";
import { pagesBn } from "./pages";
import { panelsBn } from "./panels";
import { finalPassBn, recordsBn } from "./records";
import { badgesBnDraft } from "@/components/SourceBadges/strings-bn";
import { storyBn } from "./story";
import { truthBn } from "./truth";
import { turntableBn } from "./turntable";

export const bn: Partial<Messages> = { ...appBn, ...helpBn, ...captionsBn, ...panelsBn, ...contextBn, ...storyBn, ...pagesBn, ...recordsBn, ...finalPassBn, ...badgesBnDraft, ...turntableBn, ...truthBn, ...officialBn, ...brailleBn };

/**
 * Spoken lines (Enter, the tour, Describe) are translated, so speech follows
 * the screen when the device has a Bangla voice; without one, speech stays
 * English with Bangla on screen (plan §17), see src/lib/speech-lang.ts.
 */
export const BANGLA_SPEECH_READY = true;
