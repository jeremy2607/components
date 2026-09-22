import { describe, expect, it } from 'vitest';
import { computeView, isLocated } from '../core/view';
import type { StatusItem, ViewConfig } from '../core/types';

const config: ViewConfig = { defaultCenter: [46.6, 2.4] };

function item(id: string, lat?: number | null, lng?: number | null): StatusItem {
  return { id, lat, lng, status: 'ok' };
}

describe('isLocated', () => {
  it('accepte des coordonnées finies et dans les bornes', () => {
    expect(isLocated(item('a', 43.7, 7.26))).toBe(true);
    expect(isLocated(item('b', 0, 0))).toBe(true);
  });

  it('rejette une coordonnee absente, nulle, non finie ou hors bornes', () => {
    expect(isLocated(item('a'))).toBe(false);
    expect(isLocated(item('b', null, 7.26))).toBe(false);
    expect(isLocated(item('c', 43.7, null))).toBe(false);
    expect(isLocated(item('d', Number.NaN, 7.26))).toBe(false);
    expect(isLocated(item('e', Number.POSITIVE_INFINITY, 7.26))).toBe(false);
    expect(isLocated(item('f', 91, 7.26))).toBe(false);
    expect(isLocated(item('g', 43.7, 181))).toBe(false);
  });
});

describe('computeView', () => {
  it('replie sur le centre par défaut sans aucun élément', () => {
    expect(computeView([], config)).toEqual({ kind: 'center', center: [46.6, 2.4], zoom: 5 });
  });

  it('replie sur le centre par défaut quand aucun élément n est géolocalisé', () => {
    const result = computeView([item('a'), item('b', null, null)], config);
    expect(result).toEqual({ kind: 'center', center: [46.6, 2.4], zoom: 5 });
  });

  it('centre sans cadrer sur un élément unique', () => {
    const result = computeView([item('a', 43.7, 7.26)], config);
    expect(result).toEqual({ kind: 'center', center: [43.7, 7.26], zoom: 12 });
  });

  it('centre sans cadrer quand tous les éléments partagent la même position', () => {
    const items = [item('a', 43.7, 7.26), item('b', 43.7, 7.26), item('c', 43.7, 7.26)];
    expect(computeView(items, config)).toEqual({ kind: 'center', center: [43.7, 7.26], zoom: 12 });
  });

  it('cadre sur les positions distinctes, marges et plafond compris', () => {
    const items = [item('a', 43.7, 7.26), item('b', 48.85, 2.35), item('c')];
    expect(computeView(items, config)).toEqual({
      kind: 'bounds',
      bounds: [
        [43.7, 7.26],
        [48.85, 2.35],
      ],
      padding: [48, 48],
      maxZoom: 13,
    });
  });

  it('honore les reglages fournis', () => {
    const custom: ViewConfig = {
      defaultCenter: [0, 0],
      defaultZoom: 3,
      singleItemZoom: 15,
      padding: [10, 20],
      maxZoom: 9,
    };
    expect(computeView([], custom)).toEqual({ kind: 'center', center: [0, 0], zoom: 3 });
    expect(computeView([item('a', 1, 2)], custom)).toEqual({
      kind: 'center',
      center: [1, 2],
      zoom: 15,
    });
    expect(computeView([item('a', 1, 2), item('b', 3, 4)], custom)).toMatchObject({
      padding: [10, 20],
      maxZoom: 9,
    });
  });
});
