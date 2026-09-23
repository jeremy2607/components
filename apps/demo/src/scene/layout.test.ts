import { describe, expect, it } from 'vitest';
import { graph as realGraph, type Graph, type GraphNode } from './graph';
import { boundsOf, DEFAULT_LAYOUT, layoutGraph } from './layout';

function ring(count: number): Graph {
  const nodes: GraphNode[] = Array.from({ length: count }, (_, index) => ({
    id: `c:${index}`,
    kind: 'component',
    ref: String(index),
    label: String(index),
    reachable: true,
    degree: 1,
  }));

  nodes.push({
    id: 't:hub',
    kind: 'tech',
    ref: 'hub',
    label: 'hub',
    reachable: false,
    degree: count,
  });

  const edges = nodes
    .filter((node) => node.kind === 'component')
    .map((node) => ({ source: node.id, target: 't:hub', layer: 0 }));

  return { nodes, edges, bindings: edges };
}

describe('layoutGraph', () => {
  it('place tous les noeuds', () => {
    const layout = layoutGraph(ring(6));
    expect(Object.keys(layout)).toHaveLength(7);
  });

  it('est déterministe : même graphe, mêmes coordonnées', () => {
    const graph = ring(8);
    expect(layoutGraph(graph)).toEqual(layoutGraph(graph));
  });

  it('change avec la graine, sinon elle ne servirait à rien', () => {
    const graph = ring(8);
    expect(layoutGraph(graph, { seed: 1 })).not.toEqual(layoutGraph(graph, { seed: 2 }));
  });

  it('tient dans le rayon demandé', () => {
    const layout = layoutGraph(ring(12), { radius: 10 });
    const bounds = boundsOf(layout);
    // Le rayon normalise la distance au barycentre, que `boundsOf` mesure
    // depuis le centre de la boîte : la marge couvre l'écart entre les deux.
    expect(bounds.radius).toBeLessThanOrEqual(10 * 1.35);
    expect(bounds.radius).toBeGreaterThan(1);
  });

  it('met le carrefour plus près du centre que ses feuilles', () => {
    const layout = layoutGraph(ring(10));
    const bounds = boundsOf(layout);
    const from = (id: string) => {
      const point = layout[id];
      if (!point) throw new Error(`noeud absent : ${id}`);
      return Math.hypot(
        point.x - bounds.center.x,
        point.y - bounds.center.y,
        point.z - bounds.center.z,
      );
    };

    const hub = from('t:hub');
    const leaves = Array.from({ length: 10 }, (_, index) => from(`c:${index}`));
    const average = leaves.reduce((sum, value) => sum + value, 0) / leaves.length;

    expect(hub).toBeLessThan(average);
  });

  it('sépare les noeuds : aucun couple confondu', () => {
    const layout = layoutGraph(ring(14));
    const points = Object.values(layout);

    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        if (!a || !b) continue;
        expect(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)).toBeGreaterThan(0.2);
      }
    }
  });

  it('ne produit que des nombres finis', () => {
    for (const point of Object.values(layoutGraph(realGraph))) {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
      expect(Number.isFinite(point.z)).toBe(true);
    }
  });

  it('arrondit à trois décimales, pour que deux moteurs donnent le même fichier', () => {
    for (const point of Object.values(layoutGraph(ring(5)))) {
      expect(point.x).toBe(Math.round(point.x * 1000) / 1000);
      expect(point.y).toBe(Math.round(point.y * 1000) / 1000);
      expect(point.z).toBe(Math.round(point.z * 1000) / 1000);
    }
  });

  it('survit à un graphe vide', () => {
    expect(layoutGraph({ nodes: [], edges: [], bindings: [] })).toEqual({});
  });

  it('survit à un noeud seul, sans arête', () => {
    const solo: Graph = {
      nodes: [{ id: 'c:a', kind: 'component', ref: 'a', label: 'a', reachable: true, degree: 0 }],
      edges: [],
      bindings: [],
    };
    const layout = layoutGraph(solo);
    expect(Number.isFinite(layout['c:a']?.x)).toBe(true);
  });

  it('place le graphe réel de la galerie', () => {
    const layout = layoutGraph(realGraph, DEFAULT_LAYOUT);
    expect(Object.keys(layout)).toHaveLength(realGraph.nodes.length);
  });
});

describe('boundsOf', () => {
  it('rend un centre et un rayon utilisables sur un layout vide', () => {
    expect(boundsOf({})).toEqual({ center: { x: 0, y: 0, z: 0 }, radius: 1 });
  });

  it('centre sur la boîte englobante', () => {
    const bounds = boundsOf({
      a: { x: -4, y: 0, z: 0 },
      b: { x: 6, y: 0, z: 0 },
    });
    expect(bounds.center.x).toBe(1);
    expect(bounds.radius).toBe(5);
  });
});
