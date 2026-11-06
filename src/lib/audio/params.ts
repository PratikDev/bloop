// Safe AudioParam changes (AUDIO_RESEARCH A1). Never assign `.value` after a
// param has scheduled changes, and never exponential-ramp to or from 0.

/** Glides toward target; reaches ~95 % of the way after glideSec (3 time constants). */
export function glideTo(ctx: BaseAudioContext, param: AudioParam, target: number, glideSec = 0.03) {
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.setTargetAtTime(target, now, Math.max(glideSec, 0.001) / 3);
}

/** Linear fade that lands exactly on target after sec (safe for 0). */
export function fadeTo(ctx: BaseAudioContext, param: AudioParam, target: number, sec: number) {
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(target, now + Math.max(sec, 0.001));
}

/** A short attack/decay envelope for one-shot sounds (ticks, drops, earcons). */
export function blip(param: AudioParam, time: number, peak: number, attackSec: number, decaySec: number) {
  param.setValueAtTime(0, time);
  param.linearRampToValueAtTime(peak, time + attackSec);
  param.setTargetAtTime(0, time + attackSec, decaySec / 3);
}

/**
 * Glide toward target starting at `time` on the audio clock (for sequences
 * scheduled ahead). Omitted or already-past time = now (same as glideTo).
 */
export function glideAt(ctx: BaseAudioContext, param: AudioParam, target: number, glideSec: number, time?: number) {
  if (time === undefined || time <= ctx.currentTime) return glideTo(ctx, param, target, glideSec);
  param.cancelScheduledValues(time);
  param.setTargetAtTime(target, time, Math.max(glideSec, 0.001) / 3);
}

/** Jump to a value at `time` (now if omitted or past), e.g. a new pitch while silent. */
export function jumpAt(ctx: BaseAudioContext, param: AudioParam, value: number, time?: number) {
  const t = Math.max(time ?? ctx.currentTime, ctx.currentTime);
  param.cancelScheduledValues(t);
  param.setValueAtTime(value, t);
}
