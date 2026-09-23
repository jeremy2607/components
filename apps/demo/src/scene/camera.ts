/*
 * Où se place la caméra, et comment elle y va.
 *
 * Trois poses, une seule fonction d'approche. Tout est pur : les cadrages se
 * vérifient au test, sans trois.js et sans canevas, et la scène n'a plus qu'à
 * appliquer le résultat.
 */
import type { Bounds, Point3 } from './layout.ts';

export interface Pose {
  position: Point3;
  /** Le point visé. La caméra regarde toujours quelque chose de nommé. */
  target: Point3;
}

export const FOV = 50;

function normalized(vector: Point3, fallback: Point3): Point3 {
  const length = Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
  if (length < 1e-6) return fallback;
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

/**
 * Distance à laquelle une sphère de ce rayon tient dans le cadre.
 *
 * Le champ vertical est donné ; l'horizontal s'en déduit par le rapport
 * d'image. On cadre sur le plus étroit des deux, sinon une fenêtre en hauteur
 * coupe le graphe sur les côtés.
 */
export function fitDistance(radius: number, aspect: number, fov: number = FOV): number {
  const vertical = (fov * Math.PI) / 180;
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * Math.max(aspect, 1e-3));
  return radius / Math.sin(Math.min(vertical, horizontal) / 2);
}

/**
 * Le graphe entier, vu de trois quarts : une vue de face aplatit la profondeur.
 *
 * Le cadrage vise un peu moins que la sphère englobante. Celle-ci inclut la
 * profondeur, qui ne se projette pas en largeur à l'écran : la cadrer en
 * entier laisserait le graphe petit au milieu d'un grand vide.
 */
export function overviewPose(bounds: Bounds, aspect: number, fov: number = FOV): Pose {
  const distance = fitDistance(bounds.radius * 0.88, aspect, fov);
  const direction = normalized({ x: 0.36, y: 0.26, z: 1 }, { x: 0, y: 0, z: 1 });

  return {
    position: {
      x: bounds.center.x + direction.x * distance,
      y: bounds.center.y + direction.y * distance,
      z: bounds.center.z + direction.z * distance,
    },
    target: bounds.center,
  };
}

/**
 * Un noeud, vu de l'extérieur du graphe.
 *
 * La direction d'approche part du centre vers le noeud : la caméra arrive donc
 * du dehors et ne traverse jamais le reste du graphe pour atteindre sa cible.
 * Elle est entièrement déterminée par la position du noeud, ce qui est la
 * condition pour qu'un lien profond ouvre exactement le même cadrage.
 */
export function focusPose(node: Point3, bounds: Bounds, aspect: number, fov: number = FOV): Pose {
  const outward = normalized(
    { x: node.x - bounds.center.x, y: node.y - bounds.center.y, z: node.z - bounds.center.z },
    { x: 0, y: 0, z: 1 },
  );
  const distance = fitDistance(bounds.radius * 0.3, aspect, fov);

  return {
    position: {
      x: node.x + outward.x * distance,
      y: node.y + outward.y * distance + bounds.radius * 0.08,
      z: node.z + outward.z * distance,
    },
    target: node,
  };
}

/**
 * Les strates dépliées : on recule assez pour voir la pile entière, et on se
 * place légèrement au-dessus pour que les couches se lisent comme des plans
 * superposés et non comme un seul trait.
 */
export function strataPose(
  node: Point3,
  height: number,
  bounds: Bounds,
  aspect: number,
  fov: number = FOV,
): Pose {
  const outward = normalized(
    { x: node.x - bounds.center.x, y: 0, z: node.z - bounds.center.z },
    { x: 0, y: 0, z: 1 },
  );
  const distance = fitDistance(Math.max(height, 1) * 0.72, aspect, fov);

  return {
    position: {
      x: node.x + outward.x * distance,
      y: node.y + height * 0.34,
      z: node.z + outward.z * distance,
    },
    target: node,
  };
}

/** Bornes de l'élévation : au-delà, la scène se retourne et on perd le nord. */
export const MAX_ELEVATION = 1.2;
export const ZOOM_RANGE = { min: 0.45, max: 2.4 } as const;

export function clampElevation(value: number): number {
  return Math.min(MAX_ELEVATION, Math.max(-MAX_ELEVATION, value));
}

export function clampZoom(value: number): number {
  return Math.min(ZOOM_RANGE.max, Math.max(ZOOM_RANGE.min, value));
}

/**
 * Fait tourner une pose autour de son point visé.
 *
 * La manipulation du visiteur ne remplace pas le cadrage, elle s'y ajoute :
 * l'azimut et l'élévation s'appliquent par-dessus la pose calculée, si bien
 * qu'un changement de cible garde l'angle sous lequel on regardait, et qu'un
 * lien profond reste exact tant que personne n'a tourné la scène.
 */
export function orbitAround(pose: Pose, azimuth: number, elevation: number, zoom: number): Pose {
  const dx = pose.position.x - pose.target.x;
  const dy = pose.position.y - pose.target.y;
  const dz = pose.position.z - pose.target.z;

  const radius = Math.sqrt(dx * dx + dy * dy + dz * dz) * zoom;
  if (radius < 1e-6) return pose;

  // On repart de l'angle de la pose, pour que l'orbite s'y ajoute.
  const baseAzimuth = Math.atan2(dx, dz);
  const baseElevation = Math.asin(Math.min(1, Math.max(-1, dy / Math.max(radius / zoom, 1e-6))));

  const theta = baseAzimuth + azimuth;
  const phi = clampElevation(baseElevation + elevation);
  const horizontal = Math.cos(phi) * radius;

  return {
    position: {
      x: pose.target.x + Math.sin(theta) * horizontal,
      y: pose.target.y + Math.sin(phi) * radius,
      z: pose.target.z + Math.cos(theta) * horizontal,
    },
    target: pose.target,
  };
}

/**
 * Approche exponentielle, indépendante de la fréquence d'images.
 *
 * Un `lerp` à coefficient constant va deux fois plus vite à 120 images par
 * seconde qu'à 60 : le même mouvement n'aurait pas la même durée selon
 * l'écran. En passant par `1 - e^(-lambda·dt)`, la trajectoire ne dépend que
 * du temps écoulé.
 */
export function approach(current: Pose, target: Pose, lambda: number, dt: number): Pose {
  const t = 1 - Math.exp(-lambda * Math.max(dt, 0));

  return {
    position: mix(current.position, target.position, t),
    target: mix(current.target, target.target, t),
  };
}

function mix(from: Point3, to: Point3, t: number): Point3 {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t,
  };
}

/** Vrai quand la caméra est assez proche du but pour qu'on arrête de rendre. */
export function settled(current: Pose, target: Pose, epsilon = 0.01): boolean {
  return (
    distance(current.position, target.position) < epsilon &&
    distance(current.target, target.target) < epsilon
  );
}

function distance(a: Point3, b: Point3): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}
