/*
 * Le graphe : ce que la scène met en espace.
 *
 * Données pures, sans three.js ni DOM, et lisibles par Node : le greffon Vite
 * qui calcule le layout au build importe ce fichier directement. D'où les
 * extensions explicites sur les imports de valeur.
 *
 * Le parti pris tient en une phrase : les technos sont des noeuds, pas des
 * décorations. Deux composants qui utilisent React pointent vers le même
 * noeud, et ce noeud devient un carrefour. La stack n'entoure pas la scène,
 * elle est la scène.
 */
import { catalog } from '../catalog.ts';
import { TECH } from '../tech.ts';
import type { ComponentMeta } from '../types.ts';

export type NodeKind = 'component' | 'tech';

export interface GraphNode {
  /** Préfixé par nature : un composant et une techno peuvent porter le même nom. */
  id: string;
  kind: NodeKind;
  /** L'identifiant d'origine, celui du catalogue ou du registre des technos. */
  ref: string;
  label: string;
  /** Un composant « à venir » se montre mais ne mène nulle part. */
  reachable: boolean;
  /** Nombre d'attaches. C'est ce qui distingue un carrefour d'une feuille. */
  degree: number;
}

export interface GraphEdge {
  /** Toujours un noeud de composant. */
  source: string;
  /** Toujours un noeud de techno. */
  target: string;
  /** Index de la couche d'où part le fil, dans l'ordre de `meta.layers`. */
  layer: number;
}

export interface Graph {
  nodes: readonly GraphNode[];
  /** Une arête par couple composant/techno : la vue d'ensemble ne double aucun fil. */
  edges: readonly GraphEdge[];
  /**
   * Toutes les attaches, couche par couche. La vue micro en a besoin : c'est
   * elle qui montre que la couche du bas n'a aucun fil qui en sort.
   */
  bindings: readonly GraphEdge[];
}

export function componentNodeId(ref: string): string {
  return `c:${ref}`;
}

export function techNodeId(ref: string): string {
  return `t:${ref}`;
}

interface TechEntry {
  id: string;
  label: string;
}

/**
 * Construit le graphe à partir du catalogue et du registre des technos.
 *
 * Les deux entrées sont des paramètres plutôt que des imports figés : le test
 * peut poser un catalogue minuscule et vérifier la forme du résultat sans
 * dépendre du contenu réel de la galerie.
 *
 * L'ordre de sortie est entièrement déterminé par l'ordre des entrées, sans
 * quoi le layout calculé au build changerait d'un build à l'autre.
 */
export function buildGraph(
  entries: readonly ComponentMeta[],
  registry: readonly TechEntry[],
): Graph {
  const bindings: GraphEdge[] = [];
  const degrees = new Map<string, number>();
  // Ordre d'apparition des technos réellement utilisées, registre d'abord.
  const usedTech: string[] = [];

  const seenPair = new Set<string>();
  const edges: GraphEdge[] = [];

  for (const entry of entries) {
    const source = componentNodeId(entry.id);

    entry.layers.forEach((layer, index) => {
      for (const ref of layer.tech) {
        const target = techNodeId(ref);
        bindings.push({ source, target, layer: index });

        if (!usedTech.includes(ref)) usedTech.push(ref);

        const pair = `${source}->${target}`;
        if (seenPair.has(pair)) continue;
        seenPair.add(pair);

        edges.push({ source, target, layer: index });
        degrees.set(source, (degrees.get(source) ?? 0) + 1);
        degrees.set(target, (degrees.get(target) ?? 0) + 1);
      }
    });
  }

  const labels = new Map(registry.map((tech) => [tech.id, tech.label]));

  const componentNodes: GraphNode[] = entries.map((entry) => ({
    id: componentNodeId(entry.id),
    kind: 'component',
    ref: entry.id,
    label: entry.title,
    reachable: entry.status !== 'planned',
    degree: degrees.get(componentNodeId(entry.id)) ?? 0,
  }));

  /*
   * Les technos sortent dans l'ordre du registre, puis celles qu'un `meta`
   * cite sans que le registre les connaisse. Ce cas est une faute de frappe
   * plus souvent qu'une intention, mais la faire disparaître en silence la
   * rendrait introuvable : elle apparaît, étiquetée par son identifiant, tout
   * comme une puce de techno inconnue dans la vue 2D.
   */
  const ordered = [
    ...registry.map((tech) => tech.id).filter((id) => usedTech.includes(id)),
    ...usedTech.filter((id) => !labels.has(id)),
  ];

  const techNodes: GraphNode[] = ordered.map((ref) => ({
    id: techNodeId(ref),
    kind: 'tech',
    ref,
    label: labels.get(ref) ?? ref,
    reachable: false,
    degree: degrees.get(techNodeId(ref)) ?? 0,
  }));

  return { nodes: [...componentNodes, ...techNodes], edges, bindings };
}

/** Le graphe réel de la galerie. */
export const graph: Graph = buildGraph(catalog, TECH);

export function nodeById(source: Graph, id: string): GraphNode | undefined {
  return source.nodes.find((node) => node.id === id);
}

/** Les technos attachées à une couche donnée d'un composant. */
export function techOfLayer(source: Graph, componentRef: string, layer: number): readonly string[] {
  const id = componentNodeId(componentRef);
  return source.bindings
    .filter((binding) => binding.source === id && binding.layer === layer)
    .map((binding) => binding.target);
}
