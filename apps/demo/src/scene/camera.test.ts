import { describe, expect, it } from 'vitest';
import { approach, fitDistance, focusPose, overviewPose, settled, strataPose } from './camera';
import type { Bounds } from './layout';

const bounds: Bounds = { center: { x: 0, y: 0, z: 0 }, radius: 16 };

function lengthOf(a: { x: number; y: number; z: number }) {
  return Math.hypot(a.x, a.y, a.z);
}

describe('fitDistance', () => {
  it('éloigne la caméra quand la sphère grossit', () => {
    expect(fitDistance(20, 1.6)).toBeGreaterThan(fitDistance(10, 1.6));
  });

  it('éloigne la caméra sur une fenêtre étroite, pour ne pas couper les côtés', () => {
    expect(fitDistance(10, 0.5)).toBeGreaterThan(fitDistance(10, 1.8));
  });

  it('reste fini sur un rapport d’image dégénéré', () => {
    expect(Number.isFinite(fitDistance(10, 0))).toBe(true);
  });
});

describe('overviewPose', () => {
  it('vise le centre du graphe', () => {
    expect(overviewPose(bounds, 1.6).target).toEqual(bounds.center);
  });

  it('se place assez loin pour tout cadrer', () => {
    const pose = overviewPose(bounds, 1.6);
    expect(lengthOf(pose.position)).toBeGreaterThan(bounds.radius);
  });

  it('regarde de trois quarts, pas de face', () => {
    const pose = overviewPose(bounds, 1.6);
    expect(pose.position.x).not.toBe(0);
    expect(pose.position.y).not.toBe(0);
  });
});

describe('focusPose', () => {
  const node = { x: 12, y: 0, z: 0 };

  it('vise le noeud', () => {
    expect(focusPose(node, bounds, 1.6).target).toEqual(node);
  });

  it("approche par l'extérieur, sans traverser le graphe", () => {
    const pose = focusPose(node, bounds, 1.6);
    // Le noeud est à droite du centre : la caméra doit être plus à droite encore.
    expect(pose.position.x).toBeGreaterThan(node.x);
  });

  it('est déterministe : un lien profond rouvre le même cadrage', () => {
    expect(focusPose(node, bounds, 1.6)).toEqual(focusPose(node, bounds, 1.6));
  });

  it('se rapproche plus que la vue d’ensemble', () => {
    const focus = focusPose(node, bounds, 1.6);
    const overview = overviewPose(bounds, 1.6);
    const toNode = Math.hypot(
      focus.position.x - node.x,
      focus.position.y - node.y,
      focus.position.z - node.z,
    );
    expect(toNode).toBeLessThan(lengthOf(overview.position));
  });

  it('survit à un noeud posé exactement au centre', () => {
    const pose = focusPose({ x: 0, y: 0, z: 0 }, bounds, 1.6);
    expect(Number.isFinite(pose.position.z)).toBe(true);
    expect(pose.position.z).toBeGreaterThan(0);
  });
});

describe('strataPose', () => {
  const node = { x: 0, y: 0, z: 10 };

  it('se place au-dessus de la pile pour que les couches se lisent', () => {
    expect(strataPose(node, 8, bounds, 1.6).position.y).toBeGreaterThan(node.y);
  });

  it('recule quand la pile est plus haute', () => {
    const courte = strataPose(node, 4, bounds, 1.6);
    const haute = strataPose(node, 12, bounds, 1.6);
    expect(haute.position.z).toBeGreaterThan(courte.position.z);
  });

  it('survit à une pile d’une seule couche', () => {
    expect(Number.isFinite(strataPose(node, 0, bounds, 1.6).position.z)).toBe(true);
  });
});

describe('approach', () => {
  const from = { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } };
  const to = { position: { x: 10, y: 0, z: 0 }, target: { x: 2, y: 0, z: 0 } };

  it('avance vers la cible sans la dépasser', () => {
    const next = approach(from, to, 4, 1 / 60);
    expect(next.position.x).toBeGreaterThan(0);
    expect(next.position.x).toBeLessThan(10);
  });

  it('déplace aussi le point visé', () => {
    expect(approach(from, to, 4, 1 / 60).target.x).toBeGreaterThan(0);
  });

  it('ne bouge pas sur un pas de temps nul', () => {
    expect(approach(from, to, 4, 0)).toEqual(from);
  });

  it('ignore un pas de temps négatif', () => {
    expect(approach(from, to, 4, -1)).toEqual(from);
  });

  it('ne dépend pas de la fréquence d’images', () => {
    // Une seconde à 60 images doit mener où une seconde à 30 images mène.
    let a = from;
    for (let i = 0; i < 60; i += 1) a = approach(a, to, 4, 1 / 60);

    let b = from;
    for (let i = 0; i < 30; i += 1) b = approach(b, to, 4, 1 / 30);

    expect(a.position.x).toBeCloseTo(b.position.x, 1);
  });

  it('converge', () => {
    let pose = from;
    for (let i = 0; i < 400; i += 1) pose = approach(pose, to, 6, 1 / 60);
    expect(settled(pose, to)).toBe(true);
  });
});

describe('settled', () => {
  const pose = { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } };

  it('est vrai sur place', () => {
    expect(settled(pose, pose)).toBe(true);
  });

  it('est faux quand seul le point visé a bougé', () => {
    expect(settled(pose, { ...pose, target: { x: 5, y: 0, z: 0 } })).toBe(false);
  });
});
