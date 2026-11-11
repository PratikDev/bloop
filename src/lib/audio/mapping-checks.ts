export class MappingError extends Error {
  constructor(message: string) {
    super(`mapping.json: ${message}`);
    this.name = "MappingError";
  }
}
export function fail(message: string): never {
  throw new MappingError(message);
}
export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
export function num(v: unknown, where: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) fail(`${where} must be a finite number`);
  return v;
}
export function str(v: unknown, where: string): string {
  if (typeof v !== "string" || v.length === 0) fail(`${where} must be a non-empty string`);
  return v;
}
export function oneOf<T extends string>(v: unknown, options: readonly T[], where: string): T {
  if (typeof v !== "string" || !options.includes(v as T)) {
    fail(`${where} must be one of ${options.join(", ")}`);
  }
  return v as T;
}
export function checkRange(min: number, max: number, where: string) {
  if (min >= max) fail(`${where}: min (${min}) must be less than max (${max})`);
}
export function checkOutput(o: unknown, where: string) {
  if (!isObject(o)) fail(`${where} is missing`);
  str(o.unit, `${where}.unit`);
  const min = num(o.min, `${where}.min`);
  const max = num(o.max, `${where}.max`);
  checkRange(min, max, where);
  const scale = oneOf(o.scale, ["linear", "exponential"] as const, `${where}.scale`);
  if (scale === "exponential" && min <= 0) fail(`${where}: exponential scale needs min > 0`);
}
export function checkClasses(m: Record<string, unknown>, where: string) {
  const states = m.states;
  if (!Array.isArray(states) || states.length === 0) fail(`${where}.states must be a non-empty array`);
  let prev = -Infinity;
  let chords = 0;
  states.forEach((s: unknown, i) => {
    const w = `${where}.states[${i}]`;
    if (!isObject(s)) fail(`${w} must be an object`);
    const code = num(s.code, `${w}.code`);
    if (!Number.isInteger(code) || code <= prev) fail(`${where}.states must be in ascending order of integer code`);
    prev = code;
    str(s.label, `${w}.label`);
    const sound = oneOf(s.sound, ["silence", "chord", "rumble"] as const, `${w}.sound`);
    if (sound === "silence") str(s.silence, `${w}.silence`);
    if (sound === "chord") {
      chords++;
      if (!Array.isArray(s.tones) || s.tones.length === 0) fail(`${w}.tones must be a non-empty array`);
      s.tones.forEach((x: unknown, j) => num(x, `${w}.tones[${j}]`));
    }
    if (sound === "rumble") {
      const r = s.rumble;
      if (!isObject(r)) fail(`${w}.rumble is missing`);
      if (num(r.cutoffHz, `${w}.rumble.cutoffHz`) <= 0) fail(`${w}.rumble.cutoffHz must be > 0`);
      const gain = num(r.gain, `${w}.rumble.gain`);
      if (gain <= 0 || gain > 1) fail(`${w}.rumble.gain must be in (0, 1]`);
      if (num(r.pulsesPerSecond, `${w}.rumble.pulsesPerSecond`) < 0) fail(`${w}.rumble.pulsesPerSecond must be >= 0`);
    }
    if (sound !== "chord" && s.tones !== undefined) fail(`${w}.tones belongs to a chord state only`);
    if (sound !== "rumble" && s.rumble !== undefined) fail(`${w}.rumble belongs to a rumble state only`);
  });
  if (chords > 0 && num(m.rootHz, `${where}.rootHz`) <= 0) fail(`${where}.rootHz must be > 0`);
}
export function checkMapping(m: unknown, where: string) {
  if (m === null) return;
  if (!isObject(m)) fail(`${where} must be an object or null`);
  const kind = oneOf(m.kind, ["continuous", "bands", "runtimeRange", "sameAs", "classes"] as const, `${where}.kind`);
  const input = m.input;
  if (!isObject(input)) fail(`${where}.input is missing`);
  str(input.unit, `${where}.input.unit`);

  if (kind === "classes") {
    checkClasses(m, where);
  } else if (kind === "sameAs") {
    str(m.voice, `${where}.voice`); // the referenced voice is checked once every voice is read
  } else if (kind === "continuous") {
    const min = num(input.min, `${where}.input.min`);
    const max = num(input.max, `${where}.input.max`);
    checkRange(min, max, `${where}.input`);
    const scale = oneOf(input.scale, ["linear", "log"] as const, `${where}.input.scale`);
    if (scale === "log" && min <= 0) fail(`${where}.input: log scale needs min > 0`);
    oneOf(
      (m.output as Record<string, unknown> | undefined)?.param,
      ["frequency", "dropsPerSecond", "dropsPerStep", "gain", "reverbSec", "cutoff", "clicksPerSecond"] as const,
      `${where}.output.param`,
    );
    checkOutput(m.output, `${where}.output`);
    const falling = (m.output as Record<string, unknown>).falling;
    if (falling !== undefined && typeof falling !== "boolean") fail(`${where}.output.falling must be true or false`);
  } else if (kind === "runtimeRange") {
    oneOf(input.range, ["p5-p95", "zero-to-max"] as const, `${where}.input.range`);
    oneOf(input.transform, ["none", "log1p"] as const, `${where}.input.transform`);
    oneOf(
      (m.output as Record<string, unknown> | undefined)?.param,
      ["frequency", "gain"] as const,
      `${where}.output.param`,
    );
    checkOutput(m.output, `${where}.output`);
  } else {
    oneOf(input.transform, ["abs", "none"] as const, `${where}.input.transform`);
    const bands = m.bands;
    if (!Array.isArray(bands) || bands.length === 0) fail(`${where}.bands must be a non-empty array`);
    let prev = -Infinity;
    bands.forEach((b: unknown, i) => {
      const w = `${where}.bands[${i}]`;
      if (!isObject(b)) fail(`${w} must be an object`);
      str(b.label, `${w}.label`);
      num(b.detuneCents, `${w}.detuneCents`);
      num(b.roughness, `${w}.roughness`);
      const last = i === bands.length - 1;
      if (b.upTo === null) {
        if (!last) fail(`${w}.upTo can only be null on the last band`);
        return;
      }
      const upTo = num(b.upTo, `${w}.upTo`);
      if (upTo <= prev) fail(`${where}.bands must be in ascending order of upTo`);
      prev = upTo;
    });
  }
}
