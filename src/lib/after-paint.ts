/** Runs `cb` once the page has painted (two animation frames). Returns a cancel function. */
export function afterFirstPaint(cb: () => void): () => void {
  let inner = 0;
  const outer = requestAnimationFrame(() => {
    inner = requestAnimationFrame(cb);
  });
  return () => {
    cancelAnimationFrame(outer);
    cancelAnimationFrame(inner);
  };
}
