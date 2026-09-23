import { analyzeDataQuality, isLocated } from '@jeremyprat/status-map';
import { describe, expect, it } from 'vitest';
import { ANCHORS } from './anchors';
import { generateSites } from './generateSites';
import { SITE_TAGS } from './types';

const NOW = new Date('2026-09-22T12:00:00.000Z');

/** Distance approximative en kilomètres, suffisante pour vérifier des grappes. */
function distanceKm(a: readonly [number, number], b: readonly [number, number]): number {
  const northKm = (a[0] - b[0]) * 111.32;
  const eastKm = (a[1] - b[1]) * 111.32 * Math.cos((a[0] * Math.PI) / 180);
  return Math.hypot(northKm, eastKm);
}

describe('generateSites', () => {
  it('rend exactement le même parc pour une même graine', () => {
    const first = generateSites({ seed: 1, now: NOW });
    const second = generateSites({ seed: 1, now: NOW });
    const other = generateSites({ seed: 2, now: NOW });

    expect(first).toEqual(second);
    expect(first).not.toEqual(other);
  });

  it('respecte le nombre demandé et donne des identifiants uniques', () => {
    const sites = generateSites({ count: 300, seed: 7, now: NOW });

    expect(sites).toHaveLength(300);
    expect(new Set(sites.map((site) => site.id)).size).toBe(300);
    expect(new Set(sites.map((site) => site.data.name)).size).toBe(300);
  });

  it("n'émet que des statuts et des étiquettes connus", () => {
    const sites = generateSites({ seed: 3, now: NOW });

    for (const site of sites) {
      expect(['ok', 'warning', 'offline']).toContain(site.status);
      for (const tag of site.data.tags) expect(SITE_TAGS).toContain(tag);
      expect(site.data.tags.length).toBeGreaterThan(0);
    }
  });

  it('laisse une minorité de sites sans coordonnées, pour exercer le message partiel', () => {
    const sites = generateSites({ count: 240, seed: 11, now: NOW });
    const report = analyzeDataQuality(sites);

    expect(report.severity).toBe('warning');
    expect(report.missing).toBeGreaterThan(0);
    expect(report.missing).toBeLessThan(sites.length * 0.12);
  });

  it('tient les coordonnées dans la France métropolitaine', () => {
    const sites = generateSites({ count: 300, seed: 5, now: NOW }).filter(isLocated);

    for (const site of sites) {
      expect(site.lat).toBeGreaterThan(41.3);
      expect(site.lat).toBeLessThan(51.2);
      expect(site.lng).toBeGreaterThan(-5.2);
      expect(site.lng).toBeLessThan(8.4);
    }
  });

  it('concentre assez de sites sur les trois grappes voulues', () => {
    const sites = generateSites({ count: 240, seed: 9, now: NOW }).filter(isLocated);
    const [paris, lyon, nice] = ANCHORS;

    for (const anchor of [paris, lyon, nice]) {
      if (!anchor) throw new Error('les trois premiers ancrages doivent exister');
      const nearby = sites.filter(
        (site) => distanceKm([site.lat, site.lng], [anchor.lat, anchor.lng]) < 40,
      );
      expect(nearby.length).toBeGreaterThanOrEqual(15);
    }
  });

  it('date le dernier échange plus anciennement pour un site hors ligne', () => {
    const sites = generateSites({ count: 300, seed: 13, now: NOW });
    const minutesAgo = (iso: string) => (NOW.getTime() - Date.parse(iso)) / 60_000;

    for (const site of sites) {
      const elapsed = minutesAgo(site.data.lastContact);
      if (site.status === 'offline') expect(elapsed).toBeGreaterThanOrEqual(120);
      else expect(elapsed).toBeLessThan(60);
    }
  });
});
