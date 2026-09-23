import { describe, expect, it } from 'vitest';
import { createRandom } from '../../data/random';
import { generateSites } from '../../data/generateSites';
import { countByStatus } from '../../data/filters';
import { stepSimulation } from './simulation';
import type { Site } from '../../data/types';

const NOW = Date.parse('2026-09-22T12:00:00.000Z');
const parc = generateSites({ count: 240, seed: 42, now: new Date(NOW) });

function run(sites: readonly Site[], steps: number, seed = 1, count = 3): Site[] {
  const random = createRandom(seed);
  let current = sites as Site[];
  for (let i = 0; i < steps; i += 1) current = stepSimulation(current, { random, count, now: NOW });
  return current;
}

describe('stepSimulation', () => {
  it('fait basculer exactement le nombre demandé', () => {
    const next = stepSimulation(parc, { random: createRandom(7), count: 3, now: NOW });
    const changed = next.filter((site, index) => site.status !== parc[index]?.status);

    expect(changed).toHaveLength(3);
  });

  it('laisse les autres sites strictement identiques, jusqu à leur référence', () => {
    const next = stepSimulation(parc, { random: createRandom(7), count: 3, now: NOW });
    const touched = next.filter((site, index) => site !== parc[index]);

    expect(touched).toHaveLength(3);
    for (const [index, site] of next.entries()) {
      if (touched.includes(site)) continue;
      expect(site).toBe(parc[index]);
    }
  });

  it('ne fabrique jamais un statut hors registre, ni un statut inchangé', () => {
    const next = stepSimulation(parc, { random: createRandom(3), count: 8, now: NOW });

    for (const [index, site] of next.entries()) {
      expect(['ok', 'warning', 'offline']).toContain(site.status);
      if (site !== parc[index]) expect(site.status).not.toBe(parc[index]?.status);
    }
  });

  it('accorde la date du dernier échange au nouveau statut', () => {
    const next = stepSimulation(parc, { random: createRandom(11), count: 20, now: NOW });

    for (const [index, site] of next.entries()) {
      if (site === parc[index]) continue;
      const minutes = (NOW - Date.parse(site.data.lastContact)) / 60_000;
      if (site.status === 'offline') expect(minutes).toBeGreaterThanOrEqual(120);
      else expect(minutes).toBeLessThan(60);
    }
  });

  it('rend le même parc pour une même graine', () => {
    expect(run(parc, 25, 5)).toEqual(run(parc, 25, 5));
    expect(run(parc, 25, 5)).not.toEqual(run(parc, 25, 6));
  });

  it('ne dérive pas vers un parc à l agonie sur une longue simulation', () => {
    const apres = run(parc, 400, 9);
    const counts = countByStatus(apres);

    // Le biais de tirage vers les sites en défaut doit tenir le parc debout.
    expect(counts.ok / apres.length).toBeGreaterThan(0.45);
    expect(counts.offline / apres.length).toBeLessThan(0.2);
  });

  it('bouge assez pour que la démo ait quelque chose à montrer', () => {
    const apres = run(parc, 40, 4);
    const changed = apres.filter((site, index) => site.status !== parc[index]?.status);

    expect(changed.length).toBeGreaterThan(20);
  });
});
