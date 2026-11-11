interface Chain {
  tail: GainNode | null;
}

const chains = new WeakMap<AudioNode, Chain>();

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
