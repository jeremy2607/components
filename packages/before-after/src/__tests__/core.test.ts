import { describe, expect, it } from 'vitest';
import { clampPosition, DEFAULT_POSITION, parsePosition } from '../core/position';
import { compareFrames, driftBetween, ratioOf } from '../core/ratio';

describe('clampPosition', () => {
  it('laisse passer une position valide', () => {
    expect(clampPosition(37.5)).toBe(37.5);
  });

  it('borne aux deux extrémités', () => {
    expect(clampPosition(-20)).toBe(0);
    expect(clampPosition(140)).toBe(100);
  });

  it('garde les bornes elles-mêmes', () => {
    expect(clampPosition(0)).toBe(0);
    expect(clampPosition(100)).toBe(100);
  });

  it('remplace ce qui n’est pas un nombre par la position par défaut', () => {
    expect(clampPosition(Number.NaN)).toBe(DEFAULT_POSITION);
    expect(clampPosition(Infinity)).toBe(DEFAULT_POSITION);
  });
});

describe('parsePosition', () => {
  it('lit la chaîne d’un champ de formulaire', () => {
    expect(parsePosition('72')).toBe(72);
    expect(parsePosition('12.5')).toBe(12.5);
  });

  it('borne ce qu’elle lit', () => {
    expect(parsePosition('999')).toBe(100);
  });

  it('retombe sur la valeur courante quand la chaîne ne dit rien', () => {
    expect(parsePosition('', 30)).toBe(30);
    expect(parsePosition('abc', 30)).toBe(30);
  });

  it('borne aussi le repli', () => {
    expect(parsePosition('', 500)).toBe(100);
  });
});

describe('ratioOf', () => {
  it('rend le rapport largeur sur hauteur', () => {
    expect(ratioOf({ width: 3000, height: 2000 })).toBe(1.5);
  });

  it('ne divise pas par zéro', () => {
    expect(ratioOf({ width: 100, height: 0 })).toBe(0);
  });
});

describe('driftBetween', () => {
  it('est nul pour deux rapports identiques', () => {
    expect(driftBetween(1.5, 1.5)).toBe(0);
  });

  it('est symétrique : comparer dans un sens ou dans l’autre donne pareil', () => {
    expect(driftBetween(1.5, 1.8)).toBeCloseTo(driftBetween(1.8, 1.5), 12);
  });

  it('rapporte l’écart au plus petit des deux', () => {
    expect(driftBetween(1, 1.5)).toBeCloseTo(0.5, 12);
  });

  it('survit à un rapport nul', () => {
    expect(driftBetween(0, 0)).toBe(0);
    expect(driftBetween(0, 1.5)).toBe(Infinity);
  });
});

describe('compareFrames', () => {
  const carre = { width: 1000, height: 1000 };
  const paysage = { width: 3000, height: 2000 };

  it('ne signale rien quand les deux cadres se superposent', () => {
    expect(compareFrames(paysage, { width: 1500, height: 1000 })).toBeNull();
  });

  it('tolère un écart d’arrondi d’encodeur', () => {
    expect(compareFrames({ width: 1500, height: 1000 }, { width: 1501, height: 1000 })).toBeNull();
  });

  it('signale deux cadres franchement différents', () => {
    const report = compareFrames(paysage, carre);
    expect(report).not.toBeNull();
    expect(report?.drift).toBeCloseTo(0.5, 12);
    expect(report?.ratios).toEqual({ before: 1.5, after: 1 });
  });

  it('rend les dimensions mesurées, pour que l’appelant sache quoi corriger', () => {
    expect(compareFrames(paysage, carre)?.before).toEqual(paysage);
    expect(compareFrames(paysage, carre)?.after).toEqual(carre);
  });

  it('respecte une tolérance imposée', () => {
    expect(compareFrames(paysage, carre, 1)).toBeNull();
    expect(
      compareFrames({ width: 1500, height: 1000 }, { width: 1530, height: 1000 }, 0),
    ).not.toBeNull();
  });

  it('ne conclut rien sur une image pas encore chargée', () => {
    expect(compareFrames({ width: 0, height: 0 }, paysage)).toBeNull();
    expect(compareFrames(paysage, { width: 0, height: 0 })).toBeNull();
  });
});
