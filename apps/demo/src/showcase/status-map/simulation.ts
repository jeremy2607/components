import { lastContactFor } from './data/lastContact';
import { weightedPick } from './data/random';
import type { Site, SiteStatus } from './data/types';

/**
 * Un site en défaut retient plus l'attention qu'un site sain.
 *
 * Sans ce biais de tirage, un parc majoritairement sain bascule beaucoup plus
 * souvent qu'il ne se rétablit, et la simulation dérive vers un parc à
 * l'agonie en une minute.
 */
const SELECTION_WEIGHT: Readonly<Record<SiteStatus, number>> = {
  ok: 1,
  warning: 5,
  offline: 8,
};

/** Transitions possibles. Aucun statut ne se transforme en lui-même : chaque tirage se voit. */
const TRANSITIONS: Readonly<Record<SiteStatus, readonly (readonly [SiteStatus, number])[]>> = {
  ok: [
    ['warning', 80],
    ['offline', 20],
  ],
  warning: [
    ['ok', 72],
    ['offline', 28],
  ],
  offline: [
    ['ok', 74],
    ['warning', 26],
  ],
};

export interface StepOptions {
  random: () => number;
  /** Nombre de sites qui basculent. Défaut : 3. */
  count?: number;
  now?: number;
}

/**
 * Un pas de simulation.
 *
 * Partage de structure volontaire : les sites qui ne changent pas gardent leur
 * identité, donc la carte ne refabrique que les icônes concernées et la liste
 * ne réconcilie que les lignes concernées.
 */
export function stepSimulation(sites: readonly Site[], options: StepOptions): Site[] {
  const { random, count = 3, now = Date.now() } = options;

  const pool = sites.map((site) => [site, SELECTION_WEIGHT[site.status]] as const);
  const picked = new Set<string>();
  const target = Math.min(count, sites.length);

  for (let attempt = 0; attempt < target * 6 && picked.size < target; attempt += 1) {
    picked.add(weightedPick(random, pool).id);
  }

  if (picked.size === 0) return sites as Site[];

  return sites.map((site) => {
    if (!picked.has(site.id)) return site;

    const status = weightedPick(random, TRANSITIONS[site.status]);
    return {
      ...site,
      status,
      data: { ...site.data, lastContact: lastContactFor(status, random, now) },
    };
  });
}
