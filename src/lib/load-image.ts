/** Loads an image and resolves once it can be drawn on a canvas. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Couldn't load ${src}`));
    img.src = src;
  });
}

const shared = new Map<string, Promise<HTMLImageElement>>();

/**
 * The same image for every caller on the page (the frame images are drawn by the globe, the frame, the Scenes and the
 * Turntable): one download per address; a failed load is forgotten so a later call retries.
 */
export function loadSharedImage(src: string): Promise<HTMLImageElement> {
  const cached = shared.get(src);
  if (cached) return cached;
  const pending = loadImage(src);
  shared.set(src, pending);
  pending.catch(() => shared.delete(src));
  return pending;
}
