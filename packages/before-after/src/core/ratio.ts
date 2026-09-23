/*
 * Est-ce bien la même prise de vue des deux côtés du trait ?
 *
 * C'est la seule question que le composant sait poser tout seul, et elle a son
 * importance : deux photos de rapports différents, superposées et recadrées en
 * `cover`, ne cadrent pas la même chose. Le bien n'a plus l'air d'être le même
 * d'un côté à l'autre, et personne ne voit d'où vient la gêne.
 *
 * Pur : ni React, ni DOM, ni image.
 */
import type { Dimensions, MismatchReport } from './types';

/** En dessous, l'écart relève de l'arrondi de l'encodeur, pas du cadrage. */
export const DEFAULT_TOLERANCE = 0.02;

export function ratioOf({ width, height }: Dimensions): number {
  return height > 0 ? width / height : 0;
}

/**
 * Écart relatif entre deux rapports, symétrique.
 *
 * Rapporter la différence au plus petit des deux, et non à l'un d'eux choisi
 * arbitrairement, donne la même mesure quel que soit l'ordre des arguments :
 * comparer l'avant à l'après doit donner ce que donne l'inverse.
 */
export function driftBetween(a: number, b: number): number {
  const smallest = Math.min(a, b);
  if (smallest <= 0) return a === b ? 0 : Infinity;
  return Math.abs(a - b) / smallest;
}

/**
 * Compare deux cadres. Rend `null` quand ils se superposent assez bien pour
 * que la comparaison reste honnête.
 *
 * Une image pas encore chargée a des dimensions nulles : on ne conclut rien
 * plutôt que de signaler un faux écart.
 */
export function compareFrames(
  before: Dimensions,
  after: Dimensions,
  tolerance: number = DEFAULT_TOLERANCE,
): MismatchReport | null {
  if (before.width <= 0 || before.height <= 0) return null;
  if (after.width <= 0 || after.height <= 0) return null;

  const ratios = { before: ratioOf(before), after: ratioOf(after) };
  const drift = driftBetween(ratios.before, ratios.after);
  if (drift <= tolerance) return null;

  return { before, after, ratios, drift };
}
