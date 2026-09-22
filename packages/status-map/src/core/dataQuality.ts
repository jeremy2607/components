import type { DataQualityReport, StatusItem } from './types';
import { isLocated } from './view';

/**
 * Compte les éléments exploitables et qualifie le manque.
 *
 * La gravité est double à dessein : plus rien a montrer n'appelle pas le même
 * message qu'un parc affiche aux trois quarts. Le paquet se contente de
 * rapporter, l'appelant décide quoi afficher.
 */
export function analyzeDataQuality<K extends string, D>(
  items: readonly StatusItem<K, D>[],
): DataQualityReport {
  const missingIds: string[] = [];
  let located = 0;

  for (const item of items) {
    if (isLocated(item)) located += 1;
    else missingIds.push(item.id);
  }

  const total = items.length;
  const severity =
    total === 0 || located === total
      ? null
      : located === 0
        ? ('error' as const)
        : ('warning' as const);

  return { total, located, missing: missingIds.length, missingIds, severity };
}
