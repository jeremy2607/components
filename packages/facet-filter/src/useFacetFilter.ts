import { useCallback, useMemo, useState } from 'react';
import { facetCounts } from './core/counts';
import { applyFacets } from './core/match';
import { EMPTY_SELECTION, hasSelection, toggleValue } from './core/select';
import type { Facet, FacetCounts, FacetSelection } from './core/types';

export interface UseFacetFilterOptions<T> {
  items: readonly T[];
  facets: readonly Facet<T>[];
  /**
   * Prédicat libre appliqué avant les facettes, et aux comptes.
   *
   * À mémoïser côté appelant : c'est une dépendance des deux calculs.
   */
  match?: (item: T) => boolean;
  initialSelection?: FacetSelection;
}

export interface FacetFilterState<T> {
  /** Éléments retenus. */
  items: readonly T[];
  counts: FacetCounts;
  selection: FacetSelection;
  /** Au moins une valeur cochée. Ne dit rien de `match`, que le paquet ne sait pas lire. */
  filtered: boolean;
  toggle: (facetId: string, value: string) => void;
  clear: () => void;
}

/** Détient la sélection, dérive les résultats et les comptes. */
export function useFacetFilter<T>({
  items,
  facets,
  match,
  initialSelection = EMPTY_SELECTION,
}: UseFacetFilterOptions<T>): FacetFilterState<T> {
  const [selection, setSelection] = useState<FacetSelection>(initialSelection);

  const results = useMemo(
    () => applyFacets(items, facets, selection, match),
    [items, facets, selection, match],
  );

  const counts = useMemo(
    () => facetCounts(items, facets, selection, match),
    [items, facets, selection, match],
  );

  const toggle = useCallback((facetId: string, value: string) => {
    setSelection((current) => toggleValue(current, facetId, value));
  }, []);

  const clear = useCallback(() => {
    setSelection(EMPTY_SELECTION);
  }, []);

  return { items: results, counts, selection, filtered: hasSelection(selection), toggle, clear };
}
