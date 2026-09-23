import { describe, expect, it } from 'vitest';
import type { StackLayer } from '../types';
import { strataHeight, unfold } from './strata';

const layers: readonly StackLayer[] = [
  { id: 'surface', label: 'StatusMap', summary: 'a', tech: ['react'] },
  { id: 'adaptateur', label: 'internal/', summary: 'b', tech: ['leaflet', 'css'] },
  { id: 'core', label: 'core/', summary: 'c', tech: [] },
];

const origin = { x: 4, y: -2, z: 7 };

describe('unfold', () => {
  const strata = unfold(layers, origin);

  it('rend une strate par couche', () => {
    expect(strata).toHaveLength(3);
  });

  it('empile la surface en haut et le coeur en bas', () => {
    expect(strata[0]?.position.y).toBeGreaterThan(strata[1]?.position.y ?? 0);
    expect(strata[1]?.position.y).toBeGreaterThan(strata[2]?.position.y ?? 0);
  });

  it('centre la pile sur le noeud : le composant ne saute pas au dépliage', () => {
    const average = strata.reduce((sum, layer) => sum + layer.position.y, 0) / strata.length;
    expect(average).toBeCloseTo(origin.y, 6);
  });

  it('garde la pile à l’aplomb du noeud', () => {
    for (const layer of strata) {
      expect(layer.position.x).toBe(origin.x);
      expect(layer.position.z).toBe(origin.z);
    }
  });

  it('marque pure la seule couche sans techno', () => {
    expect(strata.map((layer) => layer.pure)).toEqual([false, false, true]);
  });

  it('garde le rang et les technos de chaque couche', () => {
    expect(strata[1]?.index).toBe(1);
    expect(strata[1]?.tech).toEqual(['leaflet', 'css']);
  });

  it('respecte un écart imposé', () => {
    const large = unfold(layers, origin, { spacing: 10 });
    expect((large[0]?.position.y ?? 0) - (large[1]?.position.y ?? 0)).toBeCloseTo(10, 6);
  });

  it('survit à une pile vide', () => {
    expect(unfold([], origin)).toEqual([]);
  });

  it('pose une couche unique exactement sur le noeud', () => {
    const [only] = unfold([layers[0] as StackLayer], origin);
    expect(only?.position).toEqual(origin);
  });
});

describe('strataHeight', () => {
  it('mesure la pile, écarts compris', () => {
    expect(strataHeight(layers, { spacing: 2 })).toBe(4);
  });

  it('est nulle pour zéro ou une couche', () => {
    expect(strataHeight([])).toBe(0);
    expect(strataHeight([layers[0] as StackLayer])).toBe(0);
  });
});
