export function encodeWav(channels: readonly Float32Array[], sampleRate: number): Uint8Array {
  const n = channels[0]?.length ?? 0;
  const ch = channels.length;
  const data = n * ch * 2;
  const buf = new DataView(new ArrayBuffer(44 + data));
  const str = (o: number, s: string) => [...s].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  buf.setUint32(4, 36 + data, true);
  str(8, "WAVE");
  str(12, "fmt ");
  buf.setUint32(16, 16, true);
  buf.setUint16(20, 1, true);
  buf.setUint16(22, ch, true);
  buf.setUint32(24, sampleRate, true);
  buf.setUint32(28, sampleRate * ch * 2, true);
  buf.setUint16(32, ch * 2, true);
  buf.setUint16(34, 16, true);
  str(36, "data");
  buf.setUint32(40, data, true);
  let o = 44;
  for (let i = 0; i < n; i++)
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][i]));
      buf.setInt16(o, Math.round(v < 0 ? v * 0x8000 : v * 0x7fff), true);
      o += 2;
    }
  return new Uint8Array(buf.buffer);
}

export function fingerprint(bytes: Uint8Array): string {
  let h = 0x811c9dc5;
  for (const b of bytes) h = Math.imul(h ^ b, 0x01000193) >>> 0;
  return h.toString(16).padStart(8, "0");
}
