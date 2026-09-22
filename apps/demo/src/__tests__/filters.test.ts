import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTERS,
  countByStatus,
  countsForToggles,
  filterSites,
  isFiltered,
  toggle,
} from '../filters';
import type { Site, SiteStatus, SiteTag } from '../data/types';

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

describe('filterSites', () => {
  it('rend tout sans filtre', () => {
    expect(filterSites(sites, EMPTY_FILTERS)).toHaveLength(4);
    expect(isFiltered(EMPTY_FILTERS)).toBe(false);
  });

  it('cherche sans tenir compte des accents ni de la casse', () => {
    const trouve = (search: string) =>
      filterSites(sites, { ...EMPTY_FILTERS, search }).map((s) => s.id);

    expect(trouve('roseliere')).toEqual(['1']);
    expect(trouve('ROSELIÈRE')).toEqual(['1']);
    expect(trouve('epicea')).toEqual(['3']);
    expect(trouve('  quartz  ')).toEqual(['2']);
  });

  it('cherche aussi dans le modèle', () => {
    expect(filterSites(sites, { ...EMPTY_FILTERS, search: 'borne' }).map((s) => s.id)).toEqual([
      '4',
    ]);
  });

  it('un ensemble de statuts vide veut dire tous, pas aucun', () => {
    expect(filterSites(sites, { ...EMPTY_FILTERS, statuses: new Set() })).toHaveLength(4);
    expect(
      filterSites(sites, { ...EMPTY_FILTERS, statuses: new Set(['ok'] as const) }).map((s) => s.id),
    ).toEqual(['1', '4']);
  });

  it('retient un site portant au moins une des étiquettes demandées', () => {
    const ids = filterSites(sites, {
      ...EMPTY_FILTERS,
      tags: new Set(['prioritaire'] as const),
    }).map((s) => s.id);

    expect(ids).toEqual(['3', '4']);
  });

  it('combine les trois filtres', () => {
    const ids = filterSites(sites, {
      search: 'a',
      statuses: new Set(['ok'] as const),
      tags: new Set(['prioritaire'] as const),
    }).map((s) => s.id);

    expect(ids).toEqual(['4']);
  });
});

describe('compteurs', () => {
  it('compte par statut', () => {
    expect(countByStatus(sites)).toEqual({ ok: 2, warning: 1, offline: 1 });
  });

  it('annonce ce qu un compteur ferait apparaître, pas ce qui est affiché', () => {
    const filters = { ...EMPTY_FILTERS, statuses: new Set(['ok'] as const) };

    expect(countByStatus(filterSites(sites, filters))).toEqual({ ok: 2, warning: 0, offline: 0 });
    expect(countsForToggles(sites, filters)).toEqual({ ok: 2, warning: 1, offline: 1 });
  });

  it('tient compte des autres filtres', () => {
    const filters = { ...EMPTY_FILTERS, tags: new Set(['production'] as const) };
    expect(countsForToggles(sites, filters)).toEqual({ ok: 1, warning: 0, offline: 1 });
  });
});

describe('toggle', () => {
  it('ajoute puis retire sans muter la source', () => {
    const base = new Set(['ok'] as const);
    const ajoute = toggle(base, 'offline');

    expect([...ajoute].sort()).toEqual(['offline', 'ok']);
    expect([...base]).toEqual(['ok']);
    expect([...toggle(ajoute, 'ok')]).toEqual(['offline']);
  });
});
