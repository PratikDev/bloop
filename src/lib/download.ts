// Hands the browser a file to save (braille text, a tactile disc, the listener test's results). The URL is released a
// moment later, once the download has started.

const REVOKE_MS = 1000;

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: fileName });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_MS);
}
