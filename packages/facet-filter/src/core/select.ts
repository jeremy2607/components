import type { FacetSelection } from './types';

const NONE: ReadonlySet<string> = new Set();

export const EMPTY_SELECTION: FacetSelection = Object.freeze({});

/** Valeurs cochées d'une facette. Jamais `undefined` : l'absence est un ensemble vide. */
export function selectedValues(selection: FacetSelection, facetId: string): ReadonlySet<string> {
  return selection[facetId] ?? NONE;
}

/** Au moins une valeur cochée, quelle que soit la facette. */
export function hasSelection(selection: FacetSelection): boolean {
  for (const values of Object.values(selection)) {
    if (values.size > 0) return true;
  }
  return false;
}

/**
 * Coche ou décoche une valeur, sans muter la sélection reçue.
 *
 * Une facette retombée à zéro valeur sort de l'objet plutôt que d'y rester
 * vide : deux sélections équivalentes ont ainsi la même forme, donc la
 * sérialiser dans une URL ou la comparer en amont donne un résultat stable.
 */
export function toggleValue(
  selection: FacetSelection,
  facetId: string,
  value: string,
): FacetSelection {
  const next = new Set(selectedValues(selection, facetId));
  if (!next.delete(value)) next.add(value);

  const result: Record<string, ReadonlySet<string>> = {};
  for (const [id, values] of Object.entries(selection)) {
    if (id !== facetId && values.size > 0) result[id] = values;
  }
  if (next.size > 0) result[facetId] = next;

  return result;
}
