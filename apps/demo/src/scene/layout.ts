/*
 * Le placement des noeuds, calculé une fois pour toutes au build.
 *
 * Aucune simulation de forces ne tourne dans le navigateur. La raison n'est
 * pas seulement le coût : un layout simulé à l'ouverture donne des positions
 * différentes à chaque visite, et un lien profond vers `/components/status-map`
 * ne saurait pas où poser la caméra. Ici, même graphe, mêmes coordonnées, donc
 * une scène qu'on peut viser.
 *
 * Fichier pur et lisible par Node : le greffon Vite l'exécute au build.
 */
import { createRandom } from '../data/random.ts';
import type { Graph } from './graph.ts';

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export type Layout = Readonly<Record<string, Point3>>;

export interface LayoutOptions {
  /** Graine fixe : c'est elle qui rend le résultat reproductible. */
  seed: number;
  iterations: number;
  /** Rayon de la sphère englobante après normalisation. */
  radius: number;
  /** Rappel vers l'origine : empêche un noeud isolé de partir à l'infini. */
  centering: number;
  /** Écrasement vertical : un graphe un peu tabulaire se lit mieux qu'une boule. */
  flatten: number;
}

export const DEFAULT_LAYOUT: LayoutOptions = {
  seed: 20_260_923,
  iterations: 600,
  radius: 16,
  centering: 0.012,
  flatten: 0.62,
};

function lengthOf(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Positions de départ sur une sphère de Fibonacci, plus un peu de bruit à
 * graine. La spirale seule est trop régulière : deux noeuds voisins partiraient
 * exactement à la même distance l'un de l'autre et les forces resteraient
 * symétriques, ce qui fige des configurations en miroir.
 */
function seedPositions(graph: Graph, options: LayoutOptions): Map<string, Point3> {
  const random = createRandom(options.seed);
  const count = graph.nodes.length;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const positions = new Map<string, Point3>();

  graph.nodes.forEach((node, index) => {
    const y = count === 1 ? 0 : 1 - (index / (count - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * index;
    const jitter = () => (random() - 0.5) * 0.35;

    positions.set(node.id, {
      x: (Math.cos(theta) * ring + jitter()) * options.radius,
      y: (y + jitter()) * options.radius,
      z: (Math.sin(theta) * ring + jitter()) * options.radius,
    });
  });

  return positions;
}

/**
 * Fruchterman-Reingold en trois dimensions, avec deux ajouts.
 *
 * Le premier est la masse : un noeud est d'autant plus lourd qu'il a
 * d'attaches, donc une techno partagée bouge peu et ses utilisateurs viennent
 * se ranger autour d'elle. C'est ce qui fabrique les carrefours au lieu d'une
 * étoile molle.
 *
 * Le second est le refroidissement linéaire, qui borne le déplacement d'une
 * itération : sans lui, les premières passes envoient les noeuds isolés très
 * loin et le graphe ne revient jamais.
 */
export function layoutGraph(graph: Graph, overrides: Partial<LayoutOptions> = {}): Layout {
  const options = { ...DEFAULT_LAYOUT, ...overrides };
  const positions = seedPositions(graph, options);
  const count = graph.nodes.length;

  if (count === 0) return {};

  // Distance idéale entre deux noeuds, pour le volume qu'on leur donne.
  const k = options.radius * Math.cbrt(1 / count) * 1.9;
  const masses = new Map(graph.nodes.map((node) => [node.id, 1 + node.degree * 0.85]));
  const displacement = new Map<string, Point3>();

  for (let step = 0; step < options.iterations; step += 1) {
    const temperature = options.radius * 0.1 * (1 - step / options.iterations);

    for (const node of graph.nodes) displacement.set(node.id, { x: 0, y: 0, z: 0 });

    // Répulsion de tous contre tous. Moins de cent noeuds : le coût quadratique
    // est payé au build, une fois, et ne coûte rien au visiteur.
    for (let i = 0; i < count; i += 1) {
      const a = graph.nodes[i];
      if (!a) continue;
      const pa = positions.get(a.id);
      const da = displacement.get(a.id);
      if (!pa || !da) continue;

      for (let j = i + 1; j < count; j += 1) {
        const b = graph.nodes[j];
        if (!b) continue;
        const pb = positions.get(b.id);
        const db = displacement.get(b.id);
        if (!pb || !db) continue;

        let dx = pa.x - pb.x;
        let dy = pa.y - pb.y;
        let dz = pa.z - pb.z;
        let distance = lengthOf(dx, dy, dz);

        // Deux noeuds exactement confondus n'ont pas de direction de fuite :
        // on leur en invente une, stable, plutôt que de diviser par zéro.
        if (distance < 1e-6) {
          dx = ((i % 3) - 1) * 1e-3;
          dy = ((j % 3) - 1) * 1e-3;
          dz = 1e-3;
          distance = lengthOf(dx, dy, dz);
        }

        const force = (k * k) / distance;
        const ux = (dx / distance) * force;
        const uy = (dy / distance) * force;
        const uz = (dz / distance) * force;

        da.x += ux;
        da.y += uy;
        da.z += uz;
        db.x -= ux;
        db.y -= uy;
        db.z -= uz;
      }
    }

    // Attraction le long des arêtes.
    for (const edge of graph.edges) {
      const ps = positions.get(edge.source);
      const pt = positions.get(edge.target);
      const ds = displacement.get(edge.source);
      const dt = displacement.get(edge.target);
      if (!ps || !pt || !ds || !dt) continue;

      const dx = ps.x - pt.x;
      const dy = ps.y - pt.y;
      const dz = ps.z - pt.z;
      const distance = Math.max(lengthOf(dx, dy, dz), 1e-6);
      const force = (distance * distance) / k;
      const ux = (dx / distance) * force;
      const uy = (dy / distance) * force;
      const uz = (dz / distance) * force;

      ds.x -= ux;
      ds.y -= uy;
      ds.z -= uz;
      dt.x += ux;
      dt.y += uy;
      dt.z += uz;
    }

    for (const node of graph.nodes) {
      const position = positions.get(node.id);
      const delta = displacement.get(node.id);
      const mass = masses.get(node.id) ?? 1;
      if (!position || !delta) continue;

      delta.x -= position.x * options.centering * k;
      delta.y -= position.y * options.centering * k;
      delta.z -= position.z * options.centering * k;

      const magnitude = Math.max(lengthOf(delta.x, delta.y, delta.z), 1e-6);
      const move = Math.min(magnitude, temperature) / mass;

      position.x += (delta.x / magnitude) * move;
      // Le déplacement vertical est bridé : le graphe s'étale plutôt que de
      // former une boule, et une vue d'ensemble de face en montre davantage.
      position.y += (delta.y / magnitude) * move * options.flatten;
      position.z += (delta.z / magnitude) * move;
    }
  }

  return normalize(positions, options.radius);
}

/**
 * Recentre sur le barycentre et ramène le plus lointain sur le rayon voulu.
 *
 * La caméra et les distances de la scène sont écrites pour ce rayon : sans
 * cette normalisation, ajouter un composant changerait l'échelle de la scène
 * entière et tous les cadrages avec.
 */
function normalize(positions: Map<string, Point3>, radius: number): Layout {
  const entries = [...positions.entries()];
  if (entries.length === 0) return {};

  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (const [, point] of entries) {
    cx += point.x;
    cy += point.y;
    cz += point.z;
  }
  cx /= entries.length;
  cy /= entries.length;
  cz /= entries.length;

  let extent = 0;
  for (const [, point] of entries) {
    extent = Math.max(extent, lengthOf(point.x - cx, point.y - cy, point.z - cz));
  }

  const scale = extent < 1e-6 ? 1 : radius / extent;
  const result: Record<string, Point3> = {};

  for (const [id, point] of entries) {
    result[id] = {
      x: round((point.x - cx) * scale),
      y: round((point.y - cy) * scale),
      z: round((point.z - cz) * scale),
    };
  }

  return result;
}

/*
 * Trois décimales. Le JSON servi au navigateur maigrit d'un tiers, et surtout
 * l'arrondi absorbe les derniers bits de différence entre deux moteurs
 * JavaScript : le même dépôt construit sur deux machines donne le même fichier.
 */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export interface Bounds {
  center: Point3;
  radius: number;
}

export function boundsOf(layout: Layout): Bounds {
  const points = Object.values(layout);
  if (points.length === 0) return { center: { x: 0, y: 0, z: 0 }, radius: 1 };

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    minZ = Math.min(minZ, point.z);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
    maxZ = Math.max(maxZ, point.z);
  }

  const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: (minZ + maxZ) / 2 };
  let radius = 0;
  for (const point of points) {
    radius = Math.max(radius, lengthOf(point.x - center.x, point.y - center.y, point.z - center.z));
  }

  return { center, radius: Math.max(radius, 1) };
}
