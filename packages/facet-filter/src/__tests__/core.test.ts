import { describe, expect, it } from 'vitest';
import { countOf, facetCounts } from '../core/counts';
import { applyFacets, matchesFacets } from '../core/match';
import { EMPTY_SELECTION, hasSelection, toggleValue } from '../core/select';
import type { Facet, FacetSelection } from '../core/types';

interface Produit {
  id: string;
  type: string;
  etiquettes: readonly string[];
}

const facettes: readonly Facet<Produit>[] = [
  { id: 'type', label: 'Type', values: ['livre', 'film'], valuesOf: (p) => p.type },
  {
    id: 'etiquettes',
    label: 'Étiquettes',
    values: ['neuf', 'occasion', 'rare'],
    valuesOf: (p) => p.etiquettes,
  },
];

const produits: readonly Produit[] = [
  { id: 'a', type: 'livre', etiquettes: ['neuf'] },
  { id: 'b', type: 'livre', etiquettes: ['occasion', 'rare'] },
  { id: 'c', type: 'film', etiquettes: ['neuf'] },
  { id: 'd', type: 'film', etiquettes: [] },
];

const ids = (items: readonly Produit[]) => items.map((item) => item.id);
const select = (entries: Record<string, readonly string[]>): FacetSelection =>
  Object.fromEntries(Object.entries(entries).map(([id, values]) => [id, new Set(values)]));

describe('matchesFacets', () => {
  it('une facette vide veut dire toutes, pas aucune', () => {
    expect(ids(applyFacets(produits, facettes, EMPTY_SELECTION))).toEqual(['a', 'b', 'c', 'd']);
    expect(hasSelection(EMPTY_SELECTION)).toBe(false);
  });

  it('élargit à l intérieur d une facette', () => {
    expect(ids(applyFacets(produits, facettes, select({ type: ['livre', 'film'] })))).toHaveLength(
      4,
    );
  });

  it('restreint entre facettes', () => {
    const selection = select({ type: ['livre'], etiquettes: ['neuf'] });
    expect(ids(applyFacets(produits, facettes, selection))).toEqual(['a']);
  });

  it('retient un élément portant au moins une des valeurs demandées', () => {
    expect(ids(applyFacets(produits, facettes, select({ etiquettes: ['rare'] })))).toEqual(['b']);
  });

  it('ignore la facette exclue', () => {
    const selection = select({ type: ['livre'] });
    const film = produits[2];
    if (!film) throw new Error('jeu de test incomplet');

    expect(matchesFacets(film, facettes, selection)).toBe(false);
    expect(matchesFacets(film, facettes, selection, 'type')).toBe(true);
  });

  it('applique le prédicat libre', () => {
    const recents = (p: Produit) => p.id !== 'a';
    expect(ids(applyFacets(produits, facettes, EMPTY_SELECTION, recents))).toEqual(['b', 'c', 'd']);
  });
});

describe('facetCounts', () => {
  it('compte tout sans sélection', () => {
    const counts = facetCounts(produits, facettes, EMPTY_SELECTION);

    expect(counts['type']).toEqual({ livre: 2, film: 2 });
    expect(counts['etiquettes']).toEqual({ neuf: 2, occasion: 1, rare: 1 });
  });

  it('ne compte pas une facette contre elle-même', () => {
    const counts = facetCounts(produits, facettes, select({ type: ['livre'] }));

    // Le filtre est posé sur « type », donc les comptes de « type » l ignorent :
    // sinon « film » tomberait à zéro et deviendrait impossible à cocher.
    expect(counts['type']).toEqual({ livre: 2, film: 2 });
    expect(counts['etiquettes']).toEqual({ neuf: 1, occasion: 1, rare: 1 });
  });

  it('tient compte des autres facettes', () => {
    const counts = facetCounts(produits, facettes, select({ etiquettes: ['neuf'] }));

    expect(counts['type']).toEqual({ livre: 1, film: 1 });
    expect(counts['etiquettes']).toEqual({ neuf: 2, occasion: 1, rare: 1 });
  });

  it('tient compte du prédicat libre', () => {
    const counts = facetCounts(produits, facettes, EMPTY_SELECTION, (p) => p.type === 'livre');
    expect(counts['etiquettes']).toEqual({ neuf: 1, occasion: 1, rare: 1 });
  });

  it('rend zéro pour une valeur jamais rencontrée', () => {
    const counts = facetCounts(produits, facettes, EMPTY_SELECTION);

    expect(countOf(counts, 'etiquettes', 'inconnue')).toBe(0);
    expect(countOf(counts, 'facette-inconnue', 'neuf')).toBe(0);
  });
});

describe('toggleValue', () => {
  it('coche, décoche, et ne mute pas la source', () => {
    const base = select({ type: ['livre'] });
    const ajoute = toggleValue(base, 'type', 'film');

    expect([...(ajoute['type'] ?? [])]).toEqual(['livre', 'film']);
    expect([...(base['type'] ?? [])]).toEqual(['livre']);
    expect(hasSelection(toggleValue(toggleValue(ajoute, 'type', 'film'), 'type', 'livre'))).toBe(
      false,
    );
  });

  it('retire la facette vidée plutôt que de la garder vide', () => {
    const vide = toggleValue(select({ type: ['livre'] }), 'type', 'livre');
    expect(Object.keys(vide)).toEqual([]);
  });

  it('laisse les autres facettes intactes', () => {
    const selection = select({ type: ['livre'], etiquettes: ['rare'] });
    const next = toggleValue(selection, 'type', 'livre');

    expect(Object.keys(next)).toEqual(['etiquettes']);
    expect([...(next['etiquettes'] ?? [])]).toEqual(['rare']);
  });
});
