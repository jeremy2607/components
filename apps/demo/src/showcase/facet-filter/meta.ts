import type { ComponentMeta } from '../../types.ts';

export const meta: ComponentMeta = {
  id: 'facet-filter',
  packageName: '@jeremyprat/facet-filter',
  title: 'facet-filter',
  tagline:
    'Un filtre à facettes dont chaque valeur annonce ce qu’elle ferait apparaître, pas ce qui est déjà affiché.',
  status: 'stable',

  problem:
    "Un filtre à facettes est facile à écrire et facile à rendre inutilisable. Le piège est toujours le même : compter les résultats après filtrage. Toutes les valeurs non cochées de la facette en cours tombent alors à zéro, l'utilisateur ne peut plus élargir sans d'abord décocher, et il se retrouve enfermé dans son propre filtre. Le bon compte, pour une valeur, c'est le nombre de résultats qu'elle ferait apparaître si on la cochait.",

  decisions: [
    {
      title: 'Les comptes sont disjonctifs',
      body: "Pour chaque facette, on compte comme si elle seule n'était pas cochée. Les autres facettes et la recherche s'appliquent, elle non. C'est la seule règle non évidente du paquet, et c'est celle qui décide si le filtre est utilisable ou non.",
    },
    {
      title: 'Vide veut dire toutes, jamais aucune',
      body: "Une facette sans valeur cochée ne filtre rien. L'état initial est donc exactement l'état sans filtre, et une facette qu'on vide sort de l'objet de sélection plutôt que d'y rester vide : deux sélections équivalentes ont la même forme, ce qui rend leur comparaison et leur mise en URL prévisibles.",
    },
    {
      title: 'OU dedans, ET dehors',
      body: 'Cocher deux étiquettes élargit, cocher une étiquette et un statut restreint. C’est la convention de toutes les recherches à facettes ; s’en écarter surprend tout le monde, y compris celui qui a écrit le code.',
    },
    {
      title: 'Une valeur à zéro est désactivée, sauf si elle est cochée',
      body: "La cocher ne changerait rien à l'affichage, et un bouton qui ne fait rien est un piège. Mais une valeur cochée tombée à zéro reste cliquable, sinon on ne pourrait plus la décocher.",
    },
    {
      title: 'Le paquet ne connaît aucun domaine',
      body: "`valuesOf` est le seul endroit où un élément est interprété, et il vient de l'appelant. Tout ce qui n'est pas énumérable en valeurs, une recherche texte ou une plage de dates, passe par un prédicat libre qui s'applique aussi aux comptes : sinon un compteur promettrait des résultats que la recherche exclut.",
    },
  ],

  // TODO Jeremy : le vrai projet d'où vient ce filtre.
  realProject: {
    name: 'TODO — nom du projet',
    context: 'TODO — une phrase : quel écran, quel volume, quelle facette posait problème.',
    url: null,
  },

  layers: [
    {
      id: 'surface',
      label: 'FacetChips',
      summary: 'Un groupe de puces à bascule, remplaçable : le rendu est libre.',
      tech: ['react', 'css'],
    },
    {
      id: 'orchestration',
      label: 'useFacetFilter',
      summary: 'Détient la sélection, dérive les résultats et les comptes, et rien de plus.',
      tech: ['react'],
    },
    {
      id: 'core',
      label: 'core/',
      summary: 'Correspondance, comptes disjonctifs, bascule immuable. Ni React, ni DOM.',
      tech: [],
    },
  ],

  props: [
    { name: 'items', type: 'readonly T[]', required: true, summary: 'Les éléments à filtrer.' },
    {
      name: 'facets',
      type: 'readonly Facet<T>[]',
      required: true,
      summary: 'Les axes : identifiant, valeurs possibles, et lecture des valeurs d’un élément.',
    },
    {
      name: 'match',
      type: '(item: T) => boolean',
      required: false,
      summary: 'Prédicat libre appliqué aux résultats et aux comptes. À mémoïser.',
    },
    {
      name: 'initialSelection',
      type: 'FacetSelection',
      required: false,
      summary: 'Valeurs cochées au montage.',
    },
    { name: '→ items', type: 'readonly T[]', required: false, summary: 'Éléments retenus.' },
    {
      name: '→ counts',
      type: 'FacetCounts',
      required: false,
      summary: 'Comptes disjonctifs, à lire avec `countOf`.',
    },
    {
      name: '→ selection',
      type: 'FacetSelection',
      required: false,
      summary: 'Valeurs cochées, par facette.',
    },
    {
      name: '→ filtered',
      type: 'boolean',
      required: false,
      summary: 'Au moins une valeur cochée. Ne dit rien de `match`.',
    },
    {
      name: '→ toggle',
      type: '(facetId, value) => void',
      required: false,
      summary: 'Coche ou décoche.',
    },
    { name: '→ clear', type: '() => void', required: false, summary: 'Efface toute la sélection.' },
  ],

  install: 'pnpm add @jeremyprat/facet-filter',

  snippet: `import { FacetChips, useFacetFilter } from '@jeremyprat/facet-filter';
import '@jeremyprat/facet-filter/styles.css';

const facets = [
  { id: 'status', label: 'Statut', values: ['ok', 'warning', 'offline'], valuesOf: (s) => s.status },
  { id: 'tags', label: 'Étiquettes', values: TAGS, valuesOf: (s) => s.data.tags },
];

export function Liste({ sites, search }) {
  const match = useMemo(() => searchPredicate(search), [search]);
  const { items, counts, selection, toggle, clear } = useFacetFilter({ items: sites, facets, match });

  return (
    <>
      {facets.map((facet) => (
        <FacetChips
          key={facet.id}
          facet={facet}
          counts={counts}
          selection={selection}
          onToggle={toggle}
        />
      ))}
      <p>{items.length} sur {sites.length}</p>
    </>
  );
}`,

  seo: {
    title: 'facet-filter — filtre à facettes React avec comptes disjonctifs',
    description:
      'Hook et composant React pour filtrer par facettes, avec des comptes qui annoncent ce que chaque valeur ferait apparaître plutôt que ce qui est déjà affiché.',
  },
};
