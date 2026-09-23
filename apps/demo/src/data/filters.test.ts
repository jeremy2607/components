import { EMPTY_SELECTION, facetCounts, type FacetSelection } from '@jeremyprat/facet-filter';
import { describe, expect, it } from 'vitest';
import { SITE_FACETS, countByStatus, filterSites, searchPredicate } from './filters';
import type { Site, SiteStatus, SiteTag } from './types';

function site(
  id: string,
  name: string,
  status: SiteStatus,
  tags: readonly SiteTag[],
  model = 'Relais 120',
): Site {
  return {
    id,
    status,
    lat: 46,
    lng: 2,
    data: { name, model, tags, lastContact: '2026-09-22T12:00:00.000Z' },
  };
}

const sites: Site[] = [
  site('1', 'Roselière 001', 'ok', ['production']),
  site('2', 'Quartz 002', 'warning', ['maintenance']),
  site('3', 'Épicéa 003', 'offline', ['production', 'prioritaire']),
  site('4', 'Basalte 004', 'ok', ['prioritaire'], 'Borne 40'),
];

const select = (entries: Record<string, readonly string[]>): FacetSelection =>
  Object.fromEntries(Object.entries(entries).map(([id, values]) => [id, new Set(values)]));

const ids = (items: readonly Site[]) => items.map((item) => item.id);

describe('recherche', () => {
  it('ignore les accents et la casse', () => {
    const trouve = (query: string) => ids(filterSites(sites, EMPTY_SELECTION, query));

    expect(trouve('roseliere')).toEqual(['1']);
    expect(trouve('ROSELIÈRE')).toEqual(['1']);
    expect(trouve('epicea')).toEqual(['3']);
    expect(trouve('  quartz  ')).toEqual(['2']);
  });

  it('cherche aussi dans le modèle', () => {
    expect(ids(filterSites(sites, EMPTY_SELECTION, 'borne'))).toEqual(['4']);
  });

  it('ne fabrique pas de prédicat pour un champ vide', () => {
    expect(searchPredicate('   ')).toBeUndefined();
  });
});

describe('facettes du parc', () => {
  it('lit le statut et les étiquettes là où ils sont', () => {
    expect(ids(filterSites(sites, select({ status: ['ok'] })))).toEqual(['1', '4']);
    expect(ids(filterSites(sites, select({ tags: ['prioritaire'] })))).toEqual(['3', '4']);
  });

  it('combine les facettes et la recherche', () => {
    const resultat = filterSites(sites, select({ status: ['ok'], tags: ['prioritaire'] }), 'a');
    expect(ids(resultat)).toEqual(['4']);
  });

  it('annonce ce qu un compteur ferait apparaître, pas ce qui est affiché', () => {
    const selection = select({ status: ['ok'] });

    expect(countByStatus(filterSites(sites, selection))).toEqual({ ok: 2, warning: 0, offline: 0 });
    expect(facetCounts(sites, SITE_FACETS, selection)['status']).toEqual({
      ok: 2,
      warning: 1,
      offline: 1,
    });
  });
});
