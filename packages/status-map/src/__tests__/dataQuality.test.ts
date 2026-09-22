import { describe, expect, it } from 'vitest';
import { analyzeDataQuality } from '../core/dataQuality';
import type { StatusItem } from '../core/types';

function item(id: string, lat?: number | null, lng?: number | null): StatusItem {
  return { id, lat, lng, status: 'ok' };
}

describe('analyzeDataQuality', () => {
  it('ne signale rien sur un parc vide', () => {
    expect(analyzeDataQuality([])).toEqual({
      total: 0,
      located: 0,
      missing: 0,
      missingIds: [],
      severity: null,
    });
  });

  it('ne signale rien quand tout est géolocalisé', () => {
    const report = analyzeDataQuality([item('a', 43.7, 7.26), item('b', 48.85, 2.35)]);
    expect(report.severity).toBeNull();
    expect(report.located).toBe(2);
  });

  it('remonte une erreur quand plus rien n est affichable', () => {
    const report = analyzeDataQuality([item('a'), item('b')]);
    expect(report).toEqual({
      total: 2,
      located: 0,
      missing: 2,
      missingIds: ['a', 'b'],
      severity: 'error',
    });
  });

  it('remonte un avertissement quand l affichage est partiel', () => {
    const report = analyzeDataQuality([item('a', 43.7, 7.26), item('b')]);
    expect(report).toEqual({
      total: 2,
      located: 1,
      missing: 1,
      missingIds: ['b'],
      severity: 'warning',
    });
  });

  it('compte une coordonnee invalide comme manquante', () => {
    const report = analyzeDataQuality([item('a', 43.7, 7.26), item('b', Number.NaN, 7.26)]);
    expect(report.severity).toBe('warning');
    expect(report.missingIds).toEqual(['b']);
  });
});
