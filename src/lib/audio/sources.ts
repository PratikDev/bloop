// Registry of playing source nodes, so stopAll() can stop them after its fade.
// Each source is tagged with the stop "epoch" it started in: a stop only ends
// sources that were already playing when it was requested, never ones started
// during its fade.

let epoch = 0;
const playing = new Map<AudioScheduledSourceNode, number>();

/** Registers a source; it unregisters itself when it ends. Returns the node for chaining. */
export function track<T extends AudioScheduledSourceNode>(node: T): T {
  playing.set(node, epoch);
  node.addEventListener("ended", () => playing.delete(node), { once: true });
  return node;
}

/** Starts a new epoch and returns the one being stopped. */
export function beginStop(): number {
  return epoch++;
}

export function currentEpoch(): number {
  return epoch;
}

/** Stops every source that started in `upToEpoch` or earlier. */
export function stopSources(upToEpoch: number) {
  for (const [node, e] of playing) {
    if (e > upToEpoch) continue;
    try {
      node.stop();
    } catch {
      // already stopped
    }
    playing.delete(node);
  }
}
