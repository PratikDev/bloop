// Summing points that render the same bits every time. Chromium adds up a node's inputs in an order that changes from
// run to run; with three or more sounding inputs the float sums differ by an ULP, enough to flip a 16-bit sample in a
// WAV (measured: 2 inputs, 0 differing samples; 3 inputs, 274 924; the same 6 inputs as a chain of pairs, 0). Offline
// renders (the WAV, the pitch-identity proof) therefore add each input through its own link of a chain, so every node
// sums exactly two. Live contexts connect directly: no chain grows there.

interface Chain {
  tail: GainNode | null;
}

const chains = new WeakMap<AudioNode, Chain>();

/** Connects `node` into `target`: directly when live, through a two-input link of `target`'s chain when offline. */
export function mixInto(node: AudioNode, target: AudioNode): void {
  const ctx = target.context;
  if (typeof OfflineAudioContext === "undefined" || !(ctx instanceof OfflineAudioContext)) {
    node.connect(target);
    return;
  }
  let chain = chains.get(target);
  if (!chain) chains.set(target, (chain = { tail: null }));
  const link = new GainNode(ctx, { gain: 1 });
  node.connect(link);
  if (chain.tail) {
    chain.tail.disconnect();
    chain.tail.connect(link);
  }
  link.connect(target);
  chain.tail = link;
}
