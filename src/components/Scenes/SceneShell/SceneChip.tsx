"use client";

import { ChipFrame, type ChipFrameProps } from "../../Turntable/NeedleChip/ChipFrame";

/** A scene's controls along the bottom (caption, scrubber, legend, disclosure, dock) are taller than the Turntable's. */
const SCENE_BOTTOM_RESERVE_PX = 300;

/** The Turntable's needle chip in a scene: the card stops above the scene's bottom controls. */
export function SceneChip(props: Omit<ChipFrameProps, "bottomReserve">) {
  return <ChipFrame bottomReserve={SCENE_BOTTOM_RESERVE_PX} {...props} />;
}
