import type { Site, SiteStatus, SiteTag } from './data/types';

export interface SiteFilters {
  search: string;
  /** Vide signifie « tous les statuts », pas « aucun ». */
  statuses: ReadonlySet<SiteStatus>;
  tags: ReadonlySet<SiteTag>;
}

export const EMPTY_FILTERS: SiteFilters = {
  search: '',
  statuses: new Set(),
  tags: new Set(),
};

/** Recherche insensible aux accents : « roseliere » doit trouver « Roselière ». */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function isFiltered(filters: SiteFilters): boolean {
  return filters.search.trim() !== '' || filters.statuses.size > 0 || filters.tags.size > 0;
}

export function filterSites(sites: readonly Site[], filters: SiteFilters): Site[] {
  const needle = normalize(filters.search.trim());

  return sites.filter((site) => {
    if (filters.statuses.size > 0 && !filters.statuses.has(site.status)) return false;
    if (filters.tags.size > 0 && !site.data.tags.some((tag) => filters.tags.has(tag))) return false;
    if (needle === '') return true;

    return (
      normalize(site.data.name).includes(needle) || normalize(site.data.model).includes(needle)
    );
  });
}

export type StatusCounts = Readonly<Record<SiteStatus, number>>;

export function countByStatus(sites: readonly Site[]): StatusCounts {
  const counts = { ok: 0, warning: 0, offline: 0 };
  for (const site of sites) counts[site.status] += 1;
  return counts;
}

/**
 * Compte affiché par les compteurs de statut.
 *
 * Les autres filtres s'appliquent, mais pas celui des statuts : un compteur
 * doit annoncer ce qu'il ferait apparaître, pas ce qui est déjà affiché.
 */
export function countsForToggles(sites: readonly Site[], filters: SiteFilters): StatusCounts {
  return countByStatus(filterSites(sites, { ...filters, statuses: new Set() }));
}

export function toggle<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  if (!next.delete(value)) next.add(value);
  return next;
}
