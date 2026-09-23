import { describe, expect, it } from 'vitest';
import { chooseTier, settingsFor, type Capabilities } from './tiers';

const able: Capabilities = {
  webgl: true,
  reducedMotion: false,
  coarsePointer: false,
  memory: 16,
  cores: 10,
};

describe('chooseTier', () => {
  it('bascule en 2D sans WebGL', () => {
    expect(chooseTier({ ...able, webgl: false })).toBe('2d');
  });

  it('bascule en 2D quand le visiteur demande moins de mouvement', () => {
    expect(chooseTier({ ...able, reducedMotion: true })).toBe('2d');
  });

  it("préfère la 2D au mobile quand les deux s'appliquent", () => {
    expect(chooseTier({ ...able, reducedMotion: true, coarsePointer: true })).toBe('2d');
  });

  it('descend au palier mobile sur un pointeur grossier', () => {
    expect(chooseTier({ ...able, coarsePointer: true })).toBe('mobile');
  });

  it('monte au palier haut sur une machine confortable', () => {
    expect(chooseTier(able)).toBe('haut');
  });

  it('reste au palier moyen quand la machine ne dit rien', () => {
    expect(chooseTier({ ...able, memory: null, cores: null })).toBe('moyen');
  });

  it('descend au palier moyen sous quatre gigaoctets', () => {
    expect(chooseTier({ ...able, memory: 2 })).toBe('moyen');
  });

  it('descend au palier moyen sous huit coeurs', () => {
    expect(chooseTier({ ...able, cores: 4 })).toBe('moyen');
  });
});

describe('settingsFor', () => {
  it("n'a rien à régler en 2D", () => {
    expect(settingsFor('2d')).toBeNull();
  });

  it('plafonne le rapport de pixels sous 1,75 partout', () => {
    for (const tier of ['haut', 'moyen', 'mobile'] as const) {
      expect(settingsFor(tier)?.maxPixelRatio).toBeLessThanOrEqual(1.75);
    }
  });

  it('allège la poussière et la dérive à mesure que le palier descend', () => {
    const haut = settingsFor('haut');
    const moyen = settingsFor('moyen');
    const mobile = settingsFor('mobile');

    expect(haut?.dust).toBeGreaterThan(moyen?.dust ?? 0);
    expect(moyen?.dust).toBeGreaterThan(mobile?.dust ?? 0);
    expect(mobile?.drift).toBe(false);
  });
});
