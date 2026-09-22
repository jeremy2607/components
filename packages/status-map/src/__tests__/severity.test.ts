import { describe, expect, it } from 'vitest';
import { resolveWorstStatus } from '../core/severity';
import type { StatusRegistry } from '../core/types';

const statuses: StatusRegistry = {
  ok: { color: '#1ED760', severity: 0 },
  warning: { color: '#FFBE4E', severity: 1 },
  offline: { color: '#FF4E5E', severity: 2 },
};

describe('resolveWorstStatus', () => {
  it('rend null sur un ensemble vide', () => {
    expect(resolveWorstStatus([], statuses)).toBeNull();
  });

  it('retient la sévérité la plus haute, quel que soit l ordre', () => {
    expect(resolveWorstStatus(['ok', 'offline', 'warning'], statuses)).toBe('offline');
    expect(resolveWorstStatus(['offline', 'ok'], statuses)).toBe('offline');
    expect(resolveWorstStatus(['ok', 'warning'], statuses)).toBe('warning');
    expect(resolveWorstStatus(['ok', 'ok'], statuses)).toBe('ok');
  });

  it('ignore les clés inconnues et les marqueurs sans statut', () => {
    expect(resolveWorstStatus(['inconnu', undefined, 'warning'], statuses)).toBe('warning');
    expect(resolveWorstStatus(['inconnu', undefined], statuses)).toBeNull();
  });

  it('ne suppose aucun ordre dans le registre : seule la sévérité compte', () => {
    const renverse: StatusRegistry = {
      critique: { color: '#000', severity: 10 },
      calme: { color: '#fff', severity: 99 },
    };
    expect(resolveWorstStatus(['critique', 'calme'], renverse)).toBe('calme');
  });

  it('accepte des sévérités négatives et non contiguës', () => {
    const libre: StatusRegistry = {
      a: { color: '#000', severity: -5 },
      b: { color: '#111', severity: 0.5 },
      c: { color: '#222', severity: 3000 },
    };
    expect(resolveWorstStatus(['a', 'b', 'c'], libre)).toBe('c');
    expect(resolveWorstStatus(['a', 'b'], libre)).toBe('b');
  });

  it('garde le premier rencontré à sévérité égale', () => {
    const egal: StatusRegistry = {
      rouge: { color: '#f00', severity: 1 },
      orange: { color: '#fa0', severity: 1 },
    };
    expect(resolveWorstStatus(['rouge', 'orange'], egal)).toBe('rouge');
    expect(resolveWorstStatus(['orange', 'rouge'], egal)).toBe('orange');
  });
});
