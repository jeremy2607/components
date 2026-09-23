// Extensions explicites : ce fichier et les `meta.ts` sont lus tels quels par
// Node, dans les scripts de coloration et de pré-rendu, et Node ESM n'invente
// pas d'extension. Les imports de type, eux, disparaissent au dépouillement.
import { meta as facetFilter } from './showcase/facet-filter/meta.ts';
import { meta as statusMap } from './showcase/status-map/meta.ts';
import type { ComponentMeta } from './types.ts';

/*
 * TODO Jeremy : ces trois entrées « à venir » sont des jalons plausibles, pas
 * ta feuille de route. Remplace-les par tes vrais prochains composants, ou
 * supprime-les. Elles n'ont pas de démo : elles existent pour que le graphe
 * montre où va la bibliothèque, et elles ne sont pas cliquables.
 */
const PLANNED: readonly ComponentMeta[] = [
  {
    id: 'virtual-table',
    packageName: null,
    title: 'virtual-table',
    tagline: 'Un tableau qui garde ses en-têtes, son tri et son clavier à cinquante mille lignes.',
    status: 'planned',
    problem: 'TODO',
    decisions: [],
    realProject: null,
    layers: [
      { id: 'surface', label: 'Table', summary: 'TODO', tech: ['react', 'css'] },
      { id: 'core', label: 'core/', summary: 'TODO', tech: [] },
    ],
    props: [],
    install: null,
    snippet: '',
    seo: { title: 'virtual-table', description: 'À venir.' },
  },
  {
    id: 'command-palette',
    packageName: null,
    title: 'command-palette',
    tagline: 'La palette de commandes, avec un registre d’actions ouvert et zéro dépendance.',
    status: 'planned',
    problem: 'TODO',
    decisions: [],
    realProject: null,
    layers: [
      { id: 'surface', label: 'Palette', summary: 'TODO', tech: ['react', 'css'] },
      { id: 'core', label: 'core/', summary: 'TODO', tech: [] },
    ],
    props: [],
    install: null,
    snippet: '',
    seo: { title: 'command-palette', description: 'À venir.' },
  },
  {
    id: 'date-range',
    packageName: null,
    title: 'date-range',
    tagline: 'Une plage de dates qui parle la langue du navigateur et se navigue au clavier.',
    status: 'planned',
    problem: 'TODO',
    decisions: [],
    realProject: null,
    layers: [
      { id: 'surface', label: 'RangePicker', summary: 'TODO', tech: ['react', 'css'] },
      { id: 'core', label: 'core/', summary: 'TODO', tech: ['intl'] },
    ],
    props: [],
    install: null,
    snippet: '',
    seo: { title: 'date-range', description: 'À venir.' },
  },
];

/**
 * La liste centrale. Ajouter un composant, c'est ajouter son `meta` ici, et
 * son import paresseux dans `registry.ts`.
 *
 * Données pures, sans import de composant : les scripts de build la lisent
 * directement avec Node.
 */
export const catalog: readonly ComponentMeta[] = [statusMap, facetFilter, ...PLANNED];

export function metaById(id: string): ComponentMeta | undefined {
  return catalog.find((entry) => entry.id === id);
}

export function techUsage(): ReadonlyMap<string, readonly string[]> {
  const usage = new Map<string, string[]>();

  for (const entry of catalog) {
    for (const layer of entry.layers) {
      for (const tech of layer.tech) {
        const users = usage.get(tech) ?? [];
        if (!users.includes(entry.id)) users.push(entry.id);
        usage.set(tech, users);
      }
    }
  }

  return usage;
}

/** Les technos d'un composant, sans doublon, dans l'ordre des couches. */
export function techOf(meta: ComponentMeta): readonly string[] {
  const seen: string[] = [];
  for (const layer of meta.layers) {
    for (const tech of layer.tech) {
      if (!seen.includes(tech)) seen.push(tech);
    }
  }
  return seen;
}
