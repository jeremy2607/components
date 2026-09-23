# @jeremyprat/facet-filter

Un filtre à facettes dont chaque valeur annonce ce qu'elle ferait apparaître,
pas ce qui est déjà affiché.

## Installation

```bash
pnpm add @jeremyprat/facet-filter
```

`react` est une dépendance de pair.

## Usage

```tsx
import { FacetChips, useFacetFilter } from '@jeremyprat/facet-filter';
import '@jeremyprat/facet-filter/styles.css';

const facets = [
  { id: 'status', label: 'Statut', values: ['ok', 'warning'], valuesOf: (s) => s.status },
  { id: 'tags', label: 'Étiquettes', values: TAGS, valuesOf: (s) => s.tags },
];

const { items, counts, selection, filtered, toggle, clear } = useFacetFilter({
  items: sites,
  facets,
});
```

## La règle qui compte

Les comptes sont **disjonctifs** : pour chaque facette, on compte comme si elle
seule n'était pas cochée. Les autres facettes et le prédicat libre
s'appliquent, elle non.

Compter sur le résultat déjà filtré met à zéro toutes les valeurs non cochées de
la facette en cours. L'utilisateur ne peut plus élargir sans d'abord décocher :
il est enfermé dans son propre filtre. Le bon compte, pour une valeur, c'est le
nombre de résultats qu'elle ferait apparaître si on la cochait.

Les autres décisions en découlent :

- **Vide veut dire toutes, jamais aucune.** L'état initial est exactement l'état
  sans filtre. Une facette qu'on vide sort de l'objet de sélection plutôt que
  d'y rester vide, donc deux sélections équivalentes ont la même forme.
- **OU dedans, ET dehors.** Cocher deux étiquettes élargit, cocher une étiquette
  et un statut restreint.
- **Une valeur à zéro est désactivée, sauf si elle est cochée.** La cocher ne
  changerait rien, et un bouton qui ne fait rien est un piège ; mais une valeur
  cochée tombée à zéro doit rester décochable.

## API

### `useFacetFilter({ items, facets, match?, initialSelection? })`

| Entrée             | Type                   | Rôle                                                       |
| ------------------ | ---------------------- | ---------------------------------------------------------- |
| `items`            | `readonly T[]`         | Les éléments à filtrer.                                    |
| `facets`           | `readonly Facet<T>[]`  | Les axes de filtrage.                                      |
| `match`            | `(item: T) => boolean` | Prédicat libre, appliqué aux résultats **et** aux comptes. |
| `initialSelection` | `FacetSelection`       | Valeurs cochées au montage.                                |

| Sortie      | Type             | Rôle                                                |
| ----------- | ---------------- | --------------------------------------------------- |
| `items`     | `readonly T[]`   | Éléments retenus.                                   |
| `counts`    | `FacetCounts`    | Comptes disjonctifs, à lire avec `countOf`.         |
| `selection` | `FacetSelection` | Valeurs cochées, par facette.                       |
| `filtered`  | `boolean`        | Au moins une valeur cochée. Ne dit rien de `match`. |
| `toggle`    | `(id, value)`    | Coche ou décoche.                                   |
| `clear`     | `()`             | Efface toute la sélection.                          |

`match` est une dépendance des deux calculs : mémoïsez-le.

### `Facet<T>`

```ts
{ id, label, values, valuesOf, labelFor? }
```

`valuesOf` est le seul endroit où un élément est interprété, et il vient de
l'appelant : le paquet ne connaît aucun domaine. Il rend une valeur, plusieurs,
ou rien.

### `FacetChips`

Un groupe de puces à bascule pour une facette. `renderValue` remplace le
contenu d'une puce si l'apparence par défaut ne convient pas. Tout est
pilotable par variables CSS `--ff-*` : aucune couleur n'est écrite en dur.

### Noyau pur

`applyFacets`, `matchesFacets`, `facetCounts`, `countOf`, `toggleValue`,
`selectedValues`, `hasSelection` sont des fonctions sans effet, testables hors
DOM et utilisables sans React.

## Ce que le paquet ne fait pas

Il ne cherche pas dans du texte, ne trie pas, ne pagine pas, ne met rien en
URL et n'affiche aucune phrase qu'on ne lui a pas donnée. Ce qui n'est pas
énumérable en valeurs passe par `match`.

## Coût

`facetCounts` est en O(facettes x éléments x valeurs par élément). Sur quelques
milliers d'éléments et trois facettes, c'est une fraction de milliseconde, et le
calcul est mémoïsé. Au-delà, il faudrait un index inversé.

## Licence

MIT
