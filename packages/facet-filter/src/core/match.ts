import { selectedValues } from './select';
import type { Facet, FacetSelection } from './types';

/** Les valeurs d'un élément, sous forme de tableau quelle que soit la forme rendue. */
export function valuesOf<T>(facet: Facet<T>, item: T): readonly string[] {
  const raw = facet.valuesOf(item);
  if (raw === undefined) return [];
  return typeof raw === 'string' ? [raw] : raw;
}

/**
 * Un élément passe-t-il les facettes cochées ?
 *
 * OU à l'intérieur d'une facette, ET entre les facettes. C'est la convention
 * de toutes les recherches à facettes : cocher deux étiquettes élargit,
 * cocher une étiquette et un statut restreint.
 *
 * `except` ignore une facette : c'est ce qui permet de compter ce qu'une
 * valeur ferait apparaître sans que sa propre facette se compte elle-même.
 */
export function matchesFacets<T>(
  item: T,
  facets: readonly Facet<T>[],
  selection: FacetSelection,
  except?: string,
): boolean {
  for (const facet of facets) {
    if (facet.id === except) continue;

    const wanted = selectedValues(selection, facet.id);
    if (wanted.size === 0) continue;

    const owned = valuesOf(facet, item);
    let hit = false;
    for (const value of owned) {
      if (wanted.has(value)) {
        hit = true;
        break;
      }
    }

    if (!hit) return false;
  }

  return true;
}

/**
 * Applique les facettes, puis le prédicat libre.
 *
 * `extra` est l'échappatoire : une recherche texte, une plage de dates, tout
 * ce qui n'est pas énumérable en valeurs. Il s'applique aussi aux comptes,
 * sinon un compteur promettrait des résultats que la recherche exclut.
 */
export function applyFacets<T>(
  items: readonly T[],
  facets: readonly Facet<T>[],
  selection: FacetSelection,
  extra?: (item: T) => boolean,
): T[] {
  return items.filter(
    (item) => (extra === undefined || extra(item)) && matchesFacets(item, facets, selection),
  );
}
