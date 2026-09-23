import { describe, expect, it } from 'vitest';
import { declutter, type LabelBox } from './declutter';

function boite(id: string, x: number, y: number, extra: Partial<LabelBox> = {}): LabelBox {
  return { id, x, y, width: 60, height: 14, priority: 0, depth: 0, ...extra };
}

describe('declutter', () => {
  it('garde tout quand rien ne se touche', () => {
    const gardees = declutter([boite('a', 0, 0), boite('b', 200, 0), boite('c', 0, 100)]);
    expect([...gardees].sort()).toEqual(['a', 'b', 'c']);
  });

  it('écarte la moins importante de deux étiquettes superposées', () => {
    const gardees = declutter([
      boite('faible', 0, 0, { priority: 0 }),
      boite('forte', 5, 3, { priority: 10 }),
    ]);
    expect(gardees.has('forte')).toBe(true);
    expect(gardees.has('faible')).toBe(false);
  });

  it('départage à priorité égale par la profondeur', () => {
    const gardees = declutter([
      boite('loin', 0, 0, { depth: 0.9 }),
      boite('pres', 4, 2, { depth: 0.1 }),
    ]);
    expect(gardees.has('pres')).toBe(true);
    expect(gardees.has('loin')).toBe(false);
  });

  it('écarte aussi deux étiquettes qui se frôlent', () => {
    // Collées bord à bord : sans écart minimal, on lirait une bouillie.
    const gardees = declutter([boite('a', 0, 0), boite('b', 61, 0)], 4);
    expect(gardees.size).toBe(1);
  });

  it('les garde toutes les deux si l’écart demandé est nul', () => {
    expect(declutter([boite('a', 0, 0), boite('b', 61, 0)], 0).size).toBe(2);
  });

  it('pose plusieurs étiquettes autour d’une gagnante sans se bloquer', () => {
    const gardees = declutter([
      boite('centre', 100, 100, { priority: 5 }),
      boite('chevauche', 105, 104),
      boite('libre', 400, 100),
    ]);
    expect([...gardees].sort()).toEqual(['centre', 'libre']);
  });

  it('est déterministe : deux appels donnent le même résultat', () => {
    const entree = [
      boite('a', 0, 0, { priority: 1 }),
      boite('b', 10, 4, { priority: 1 }),
      boite('c', 20, 8, { priority: 1 }),
    ];
    expect([...declutter(entree)]).toEqual([...declutter(entree)]);
  });

  it('ne modifie pas le tableau qu’on lui passe', () => {
    const entree = [boite('a', 0, 0, { priority: 0 }), boite('b', 300, 0, { priority: 9 })];
    const copie = [...entree];
    declutter(entree);
    expect(entree).toEqual(copie);
  });

  it('survit à une liste vide', () => {
    expect(declutter([]).size).toBe(0);
  });
});
