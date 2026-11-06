// A generated stand-in for a recorded narration clip (until L4's arrive): a
// 4 s WAV of speech-like "syllables" (pulsed, gliding tones), served from a
// blob: URL so preloadClips() fetches it like a real file.

const SAMPLE_RATE = 22050;
const SECONDS = 4;
const SYLLABLES_PER_SEC = 4;
const PEAK = 0.5;

let url: string | null = null;

function samples(): Float32Array {
  const out = new Float32Array(SAMPLE_RATE * SECONDS);
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SAMPLE_RATE;
    const syllable = (t * SYLLABLES_PER_SEC) % 1; // 0..1 within each syllable
    const freq = 180 + 80 * Math.sin(2 * Math.PI * 0.7 * t) + 40 * syllable;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const envelope = Math.sin(Math.PI * syllable) ** 2; // silent between syllables
    const edge = Math.min(1, t * 20, (SECONDS - t) * 20); // no click at the ends
    out[i] = PEAK * envelope * edge * (Math.sin(phase) + 0.3 * Math.sin(2 * phase));
  }
  return out;
}

/** 16-bit mono PCM WAV. */
function encodeWav(data: Float32Array): Blob {
  const bytes = new DataView(new ArrayBuffer(44 + data.length * 2));
  const text = (offset: number, s: string) => [...s].forEach((c, i) => bytes.setUint8(offset + i, c.charCodeAt(0)));
  text(0, "RIFF");
  bytes.setUint32(4, 36 + data.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  bytes.setUint32(16, 16, true); // fmt chunk size
  bytes.setUint16(20, 1, true); // PCM
  bytes.setUint16(22, 1, true); // mono
  bytes.setUint32(24, SAMPLE_RATE, true);
  bytes.setUint32(28, SAMPLE_RATE * 2, true); // byte rate
  bytes.setUint16(32, 2, true); // block align
  bytes.setUint16(34, 16, true); // bits per sample
  text(36, "data");
  bytes.setUint32(40, data.length * 2, true);
  data.forEach((v, i) => bytes.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true));
  return new Blob([bytes.buffer], { type: "audio/wav" });
}

/** The test clip's URL (made once per page). */
export function testClipUrl(): string {
  url ??= URL.createObjectURL(encodeWav(samples()));
  return url;
}
