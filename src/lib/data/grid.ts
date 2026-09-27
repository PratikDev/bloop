// Equirectangular grid helpers shared by every L1 grid:
// row 0 = 90° N, column 0 = 180° W, little-endian.

export interface GridSize {
  width: number;
  height: number;
}

/** Wraps longitude into [−180, 180). */
export function wrapLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

export function clampLat(lat: number): number {
  return Math.min(90, Math.max(-90, lat));
}

/** The flat index of the cell containing (lat, lon). */
export function cellIndex(size: GridSize, lat: number, lon: number): number {
  const row = Math.min(size.height - 1, Math.floor(((90 - clampLat(lat)) / 180) * size.height));
  const col = Math.min(size.width - 1, Math.floor(((wrapLon(lon) + 180) / 360) * size.width));
  return row * size.width + col;
}

/** The centre latitude of a grid row. */
export function rowLat(size: GridSize, row: number): number {
  return 90 - ((row + 0.5) / size.height) * 180;
}

const LITTLE_ENDIAN_HOST = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

/** Reads a little-endian Uint16 grid, whatever the host's byte order. */
export function readUint16LE(buffer: ArrayBuffer, size: GridSize): Uint16Array {
  const expected = size.width * size.height;
  if (buffer.byteLength !== expected * 2) {
    throw new Error(`Grid is ${buffer.byteLength} bytes; expected ${expected * 2} for ${size.width}×${size.height}`);
  }
  if (LITTLE_ENDIAN_HOST) return new Uint16Array(buffer);
  const view = new DataView(buffer);
  const out = new Uint16Array(expected);
  for (let i = 0; i < expected; i++) out[i] = view.getUint16(i * 2, true);
  return out;
}

export function readUint8(buffer: ArrayBuffer, size: GridSize): Uint8Array {
  const expected = size.width * size.height;
  if (buffer.byteLength !== expected) {
    throw new Error(`Grid is ${buffer.byteLength} bytes; expected ${expected} for ${size.width}×${size.height}`);
  }
  return new Uint8Array(buffer);
}
