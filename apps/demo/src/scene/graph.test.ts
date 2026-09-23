import { describe, expect, it } from 'vitest';
import type { ComponentMeta } from '../types';
import { buildGraph, componentNodeId, graph, techNodeId, techOfLayer } from './graph';

function meta(id: string, layers: ComponentMeta['layers'], status: ComponentMeta['status']) {
  return {
    id,
    packageName: null,
    title: id,
    tagline: '',
    status,
    problem: '',
    decisions: [],
    realProject: null,
    layers,
    props: [],
    install: null,
    snippet: '',
    seo: { title: '', description: '' },
  } satisfies ComponentMeta;
}

const registry = [
  { id: 'react', label: 'React 18' },
  { id: 'leaflet', label: 'Leaflet' },
  { id: 'css', label: 'CSS' },
];

const entries = [
  meta(
    'carte',
    [
      { id: 'surface', label: 'Carte', summary: '', tech: ['react'] },
      { id: 'adaptateur', label: 'internal/', summary: '', tech: ['leaflet', 'react'] },
      { id: 'core', label: 'core/', summary: '', tech: [] },
    ],
    'stable',
  ),
  meta(
    'filtre',
    [
      { id: 'surface', label: 'Chips', summary: '', tech: ['react', 'css'] },
      { id: 'core', label: 'core/', summary: '', tech: [] },
    ],
    'planned',
  ),
];

describe('buildGraph', () => {
  const built = buildGraph(entries, registry);

  it('fait un noeud par composant et par techno utilisée', () => {
    expect(built.nodes.map((node) => node.id)).toEqual([
      'c:carte',
      'c:filtre',
      't:react',
      't:leaflet',
      't:css',
    ]);
  });

  it('ne double pas une arête quand la techno apparaît à deux couches', () => {
    const carteToReact = built.edges.filter(
      (edge) => edge.source === 'c:carte' && edge.target === 't:react',
    );
    expect(carteToReact).toHaveLength(1);
    // La vue d'ensemble garde la couche la plus haute où la techno apparaît.
    expect(carteToReact[0]?.layer).toBe(0);
  });

  it('garde les deux attaches dans les liaisons, car la vue micro en a besoin', () => {
    const bindings = built.bindings.filter(
      (binding) => binding.source === 'c:carte' && binding.target === 't:react',
    );
    expect(bindings.map((binding) => binding.layer)).toEqual([0, 1]);
  });

  it('fait des technos partagées des carrefours', () => {
    const react = built.nodes.find((node) => node.id === 't:react');
    const leaflet = built.nodes.find((node) => node.id === 't:leaflet');
    expect(react?.degree).toBe(2);
    expect(leaflet?.degree).toBe(1);
  });

  it('montre un composant à venir sans le rendre atteignable', () => {
    expect(built.nodes.find((node) => node.id === 'c:filtre')?.reachable).toBe(false);
    expect(built.nodes.find((node) => node.id === 'c:carte')?.reachable).toBe(true);
  });

  it("n'attache aucun fil à la couche du bas quand elle n'a pas de techno", () => {
    const core = built.bindings.filter(
      (binding) => binding.source === 'c:carte' && binding.layer === 2,
    );
    expect(core).toEqual([]);
  });

  it('étiquette une techno absente du registre par son identifiant', () => {
    const orphan = buildGraph(
      [meta('x', [{ id: 's', label: 'X', summary: '', tech: ['inconnue'] }], 'stable')],
      registry,
    );
    expect(orphan.nodes.find((node) => node.id === 't:inconnue')?.label).toBe('inconnue');
  });

  it('ne garde du registre que les technos réellement utilisées', () => {
    const narrow = buildGraph(
      [meta('x', [{ id: 's', label: 'X', summary: '', tech: ['react'] }], 'stable')],
      registry,
    );
    expect(narrow.nodes.map((node) => node.id)).toEqual(['c:x', 't:react']);
  });

  it('est stable : deux constructions donnent le même graphe', () => {
    expect(buildGraph(entries, registry)).toEqual(built);
  });
});

describe('techOfLayer', () => {
  const built = buildGraph(entries, registry);

  it("rend les technos de la couche demandée, dans l'ordre", () => {
    expect(techOfLayer(built, 'carte', 1)).toEqual(['t:leaflet', 't:react']);
  });

  it('rend une liste vide pour une couche pure', () => {
    expect(techOfLayer(built, 'carte', 2)).toEqual([]);
  });
});

describe('le graphe réel de la galerie', () => {
  it('a un identifiant par nature, sans collision', () => {
    const ids = graph.nodes.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ne référence que des noeuds existants', () => {
    const ids = new Set(graph.nodes.map((node) => node.id));
    for (const edge of graph.edges) {
      expect(ids.has(edge.source)).toBe(true);
      expect(ids.has(edge.target)).toBe(true);
    }
  });

  it('a au moins un carrefour : c’est tout l’intérêt du graphe', () => {
    const hubs = graph.nodes.filter((node) => node.kind === 'tech' && node.degree > 1);
    expect(hubs.length).toBeGreaterThan(0);
  });

  it('nomme les noeuds avec les préfixes attendus', () => {
    expect(componentNodeId('status-map')).toBe('c:status-map');
    expect(techNodeId('react')).toBe('t:react');
  });
});
