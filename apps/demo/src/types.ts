/**
 * Le contrat des métadonnées de la galerie.
 *
 * Ce fichier ne contient que des types, et `catalog.ts` que des données : les
 * deux sont lisibles par Node sans passer par Vite, ce dont les scripts de
 * coloration et de pré-rendu ont besoin.
 */

export type ComponentStatus = 'stable' | 'wip' | 'planned';

export interface Decision {
  title: string;
  body: string;
}

/** Une couche du composant, et les technos qui y interviennent réellement. */
export interface StackLayer {
  id: string;
  label: string;
  summary: string;
  /** Identifiants déclarés dans `tech.ts`. Vide veut dire : cette couche ne dépend de rien. */
  tech: readonly string[];
}

export interface PropDoc {
  name: string;
  type: string;
  required: boolean;
  summary: string;
}

/** Le projet réel d'où vient le composant. */
export interface RealProject {
  name: string;
  context: string;
  url: string | null;
}

export interface ComponentMeta {
  id: string;
  /** Nom du paquet publiable, s'il existe. */
  packageName: string | null;
  title: string;
  tagline: string;
  status: ComponentStatus;
  /** Le problème résolu, en prose. */
  problem: string;
  decisions: readonly Decision[];
  realProject: RealProject | null;
  layers: readonly StackLayer[];
  props: readonly PropDoc[];
  /** Exemple d'usage, coloré au build. */
  snippet: string;
  install: string | null;
  seo: { title: string; description: string };
}
