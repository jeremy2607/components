import { matchesFacets, valuesOf } from './match';
import type { Facet, FacetCounts, FacetSelection } from './types';

/** Compte d'une valeur. Une valeur jamais rencontrée vaut zéro, pas `undefined`. */
export function countOf(counts: FacetCounts, facetId: string, value: string): number {
  return counts[facetId]?.[value] ?? 0;
}

/**
 * Comptes disjonctifs : pour chaque facette, on compte comme si elle seule
 * n'était pas cochée.
 *
 * C'est la seule règle non évidente du paquet. Compter sur le résultat déjà
 * filtré met à zéro toutes les valeurs non cochées de la facette en cours, et
 * l'utilisateur se retrouve enfermé : pour élargir, il devrait d'abord
 * décocher. Un compteur doit annoncer ce qu'il ferait apparaître, pas ce qui
 * est déjà affiché.
 *
 * Coût : O(facettes x éléments x valeurs par élément). Sur quelques milliers
 * d'éléments et trois facettes, c'est une fraction de milliseconde, et le
 * calcul est mémoïsé en amont. Au-delà, il faudrait un index inversé.
 */
export function facetCounts<T>(
  items: readonly T[],
  facets: readonly Facet<T>[],
  selection: FacetSelection,
  extra?: (item: T) => boolean,
): FacetCounts {
  const counts: Record<string, Record<string, number>> = {};

  for (const facet of facets) {
    const tally: Record<string, number> = {};
    for (const value of facet.values) tally[value] = 0;

    for (const item of items) {
      if (extra !== undefined && !extra(item)) continue;
      if (!matchesFacets(item, facets, selection, facet.id)) continue;

      for (const value of valuesOf(facet, item)) {
        tally[value] = (tally[value] ?? 0) + 1;
      }
    }

    counts[facet.id] = tally;
  }

  return counts;
}
