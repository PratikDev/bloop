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
