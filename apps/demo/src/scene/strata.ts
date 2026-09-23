/*
 * Le dépliage d'un composant en couches.
 *
 * C'est la démonstration de la galerie, et elle tient dans une propriété :
 * une couche sans techno n'a aucun fil qui en sort. Comme `core/` est toujours
 * la dernière, la couche du bas flotte, seule, détachée du reste du graphe. On
 * lit la pureté du coeur sans lire une ligne de documentation.
 *
 * Pur, et lisible par Node : le calcul ne dépend que de `meta.layers`.
 */
import type { StackLayer } from '../types.ts';
import type { Point3 } from './layout.ts';

export interface Stratum {
  id: string;
  label: string;
  summary: string;
  tech: readonly string[];
  /** Position de la couche, dans le repère du monde. */
  position: Point3;
  /** Rang, zéro pour la surface. */
  index: number;
  /**
   * Vrai quand aucune techno n'intervient à cette couche. Ce n'est pas un
   * oubli de saisie : c'est la partie du composant qui ne dépend de rien.
   */
  pure: boolean;
}

export interface StrataOptions {
  /** Écart vertical entre deux couches. */
  spacing: number;
}

export const DEFAULT_STRATA: StrataOptions = { spacing: 2.1 };

/**
 * Empile les couches autour de la position du noeud, surface en haut.
 *
 * La pile est centrée sur le noeud plutôt que posée dessus : le composant ne
 * saute pas au moment du dépliage, il s'ouvre depuis sa place dans le graphe,
 * et la caméra n'a pas à rattraper un décalage.
 */
export function unfold(
  layers: readonly StackLayer[],
  origin: Point3,
  overrides: Partial<StrataOptions> = {},
): readonly Stratum[] {
  const { spacing } = { ...DEFAULT_STRATA, ...overrides };
  const top = ((layers.length - 1) * spacing) / 2;

  return layers.map((layer, index) => ({
    id: layer.id,
    label: layer.label,
    summary: layer.summary,
    tech: layer.tech,
    index,
    pure: layer.tech.length === 0,
    position: { x: origin.x, y: origin.y + top - index * spacing, z: origin.z },
  }));
}

/** Hauteur totale de la pile dépliée, ce que la caméra doit cadrer. */
export function strataHeight(
  layers: readonly StackLayer[],
  overrides: Partial<StrataOptions> = {},
): number {
  const { spacing } = { ...DEFAULT_STRATA, ...overrides };
  return Math.max(layers.length - 1, 0) * spacing;
}
