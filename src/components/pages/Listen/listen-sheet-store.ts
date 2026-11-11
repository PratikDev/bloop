// Listen's side sheets, opened from the player's More menu (which closes as they open).

import { createSheetStore } from "@/lib/sheet-store";

export type ListenSheetId = "ask" | "journey";

export const listenSheet = createSheetStore<ListenSheetId>();
