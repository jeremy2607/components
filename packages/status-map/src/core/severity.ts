import type { StatusRegistry } from './types';

/**
 * Statut le plus grave d'un ensemble.
 *
 * La gravité se lit dans `statuses[clé].severity`, jamais dans un nom de
 * classe CSS : la couleur d'un regroupement est une conséquence de la donnée,
 * pas sa source. À gravité égale, le premier rencontré l'emporte.
 *
 * Les clés inconnues du registre sont ignorées : un parc peut porter un statut
 * que le registre ne décrit pas encore.
 */
export function resolveWorstStatus<K extends string>(
  keys: Iterable<string | undefined>,
  statuses: StatusRegistry<K>,
): K | null {
  let worstKey: K | null = null;
  let worstSeverity = Number.NEGATIVE_INFINITY;

  for (const key of keys) {
    if (key === undefined || !Object.hasOwn(statuses, key)) continue;

    const { severity } = statuses[key as K];
    if (severity > worstSeverity) {
      worstSeverity = severity;
      worstKey = key as K;
    }
  }

  return worstKey;
}
