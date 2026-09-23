import { applyFacets, type Facet, type FacetSelection } from '@jeremyprat/facet-filter';
import { statuses } from './statuses';
import { SITE_STATUSES, SITE_TAGS, type Site, type SiteStatus } from './types';

/** Recherche insensible aux accents : « roseliere » doit trouver « Roselière ». */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Prédicat de recherche, ou rien.
 *
 * Rendre `undefined` plutôt qu'un prédicat toujours vrai évite un appel de
 * fonction par élément et par facette quand le champ est vide, c'est-à-dire
 * la plupart du temps.
 */
export function searchPredicate(query: string): ((site: Site) => boolean) | undefined {
  const needle = normalize(query.trim());
  if (needle === '') return undefined;

  return (site) =>
    normalize(site.data.name).includes(needle) || normalize(site.data.model).includes(needle);
}

/**
 * Les deux axes de filtrage du parc.
 *
 * Les libellés viennent du registre de statuts : une seule source pour la
 * couleur, le glyphe et le mot.
 */
export const STATUS_FACET: Facet<Site> = {
  id: 'status',
  label: 'Statut',
  values: SITE_STATUSES,
  valuesOf: (site) => site.status,
  labelFor: (value) => statuses[value as SiteStatus].label ?? value,
};

export const TAGS_FACET: Facet<Site> = {
  id: 'tags',
  label: 'Étiquettes',
  values: SITE_TAGS,
  valuesOf: (site) => site.data.tags,
};

export const SITE_FACETS: readonly Facet<Site>[] = [STATUS_FACET, TAGS_FACET];

export type StatusCounts = Readonly<Record<SiteStatus, number>>;

export function countByStatus(sites: readonly Site[]): StatusCounts {
  const counts = { ok: 0, warning: 0, offline: 0 };
  for (const site of sites) counts[site.status] += 1;
  return counts;
}

/** Raccourci hors React, pour les tests et les scripts. */
export function filterSites(sites: readonly Site[], selection: FacetSelection, query = ''): Site[] {
  return applyFacets(sites, SITE_FACETS, selection, searchPredicate(query));
}
