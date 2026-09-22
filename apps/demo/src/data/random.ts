/**
 * Générateur pseudo-aléatoire à graine (mulberry32).
 *
 * La démo doit être reproductible : même graine, même parc, donc capture et
 * tests stables.
 */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Entier dans [0, max[. */
export function randomInt(random: () => number, max: number): number {
  return Math.floor(random() * max);
}

/** Tire un élément selon des poids relatifs. */
export function weightedPick<T>(
  random: () => number,
  entries: readonly (readonly [T, number])[],
): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let cursor = random() * total;

  for (const [value, weight] of entries) {
    cursor -= weight;
    if (cursor < 0) return value;
  }

  const last = entries[entries.length - 1];
  if (!last) throw new Error('weightedPick appelé sans entrée');
  return last[0];
}
