# components

Bibliothèque de composants React publiables indépendamment, et la galerie qui
les met en scène.

| Paquet                                              | Description                                                                     | État     |
| --------------------------------------------------- | ------------------------------------------------------------------------------- | -------- |
| [`@jeremyprat/status-map`](packages/status-map)     | Carte Leaflet d'un parc de sites géolocalisés, regroupement coloré par sévérité | en cours |
| [`@jeremyprat/facet-filter`](packages/facet-filter) | Filtre à facettes dont chaque valeur annonce ce qu'elle ferait apparaître       | en cours |
| [`@jeremyprat/before-after`](packages/before-after) | Comparateur avant / après dont le séparateur est un vrai curseur                | en cours |

---

## La galerie

[`apps/demo`](apps/demo) est la seule application du dépôt. Elle présente chaque
composant avec sa démo live (le vrai composant, pas une capture), sa pile, son
API, son code copiable et les décisions qui l'ont façonné.

Chaque composant a son URL, `/components/<id>/`, qui est un vrai fichier HTML
pré-rendu : titre, description et balises Open Graph justes sans exécuter une
ligne de JavaScript. Une démo s'ouvre en plein écran par `?demo=plein`.

La navigation 3D entre composants est le chantier suivant. Le concept retenu, la
direction artistique et le budget de performance sont dans [CLAUDE.md](CLAUDE.md).

---

## status-map

Une carte qui fait comprendre en deux secondes lesquels de vos sites vont mal.

**Démo en ligne : _(à remplir au déploiement)_** · [Code du paquet](packages/status-map) · [Démo](apps/demo/src/showcase/status-map)

<!--
  Capture animée à enregistrer puis déposer dans docs/demo.gif, et référencer ici :
  ![La carte, du parc sain au parc en alerte](docs/demo.gif)
  Le moment à capturer : cliquer sur « Simuler l'activité » et laisser tourner
  une vingtaine de secondes, pour que les regroupements se recolorent.
-->

### Le problème

Superviser un parc, ce n'est pas lire une liste de trois cents lignes. C'est repérer
immédiatement les quelques sites qui ne répondent plus, et savoir s'ils sont isolés ou
groupés. Une carte le fait mieux qu'un tableau, à une condition : qu'elle reste lisible
quand les marqueurs se chevauchent.

Le regroupement résout le chevauchement, mais il masque l'information au moment où elle
compte : un groupe de cinquante sites dont un seul est tombé doit se voir, pas se fondre
dans la masse.

### La décision de conception

Un regroupement prend la couleur du **pire statut qu'il contient**. Cette sévérité se lit
sur les marqueurs, dans `marker.options.status`, puis dans `statuses[clé].severity` : la
couleur est une conséquence de la donnée, jamais la lecture d'un nom de classe CSS. Le
registre de statuts est ouvert, donc ajouter un statut, c'est ajouter une entrée avec une
sévérité, sans toucher au composant.

### Installation

```bash
pnpm add @jeremyprat/status-map leaflet leaflet.markercluster
```

```tsx
import { StatusMap } from '@jeremyprat/status-map';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import '@jeremyprat/status-map/styles.css';

<StatusMap
  items={sites}
  statuses={{
    ok: { color: '#1ED760', severity: 0, label: 'en service', icon: <CheckPath /> },
    warning: { color: '#FFBE4E', severity: 1, label: 'en alerte', icon: <AlertPath /> },
    offline: { color: '#FF4E5E', severity: 2, label: 'hors ligne', icon: <OfflinePath /> },
  }}
  tiles={{ url, attribution }}
  view={{ defaultCenter: [46.6, 2.4], defaultZoom: 6 }}
  renderPopup={(site) => <MyPopup site={site} />}
  onSelect={(site) => navigate(`/sites/${site.id}`)}
/>;
```

### API

| Prop                     | Type                          | Rôle                                                     |
| ------------------------ | ----------------------------- | -------------------------------------------------------- |
| `items`                  | `readonly T[]`                | Éléments. `lat` et `lng` peuvent manquer.                |
| `statuses`               | `StatusRegistry<T['status']>` | Couleur, sévérité, glyphe et libellé par statut.         |
| `tiles`                  | `TileConfig`                  | Fond de carte injecté. Rien n'est codé en dur.           |
| `view`                   | `ViewConfig`                  | Centre de repli, zooms, marges de cadrage.               |
| `renderPopup`            | `(item, ctx) => ReactNode`    | Contenu libre, monté par portail. Absent, pas de bulle.  |
| `onSelect`               | `(item, event) => void`       | Clic sur un marqueur. Le composant ne navigue jamais.    |
| `selectedId`             | `string \| null`              | Sélection pilotée de l'extérieur.                        |
| `cluster`                | `ClusterConfig`               | `enabled`, `maxRadius`, options du greffon.              |
| `marker`                 | `MarkerConfig`                | Taille. Les ancres en découlent.                         |
| `popup`                  | `PopupConfig`                 | Délai de fermeture, décalage, largeur.                   |
| `labels`                 | `StatusMapLabels<T>`          | Noms accessibles. Le paquet n'embarque aucune prose.     |
| `locale`                 | `string`                      | Transmise à `renderPopup`.                               |
| `fitOnLoad`              | `boolean`                     | Cadrage initial sur les éléments. Défaut : `true`.       |
| `onDataQuality`          | `(report) => void`            | Éléments sans coordonnées, avec deux niveaux de gravité. |
| `mapOptions` / `onReady` |                               | Échappatoires vers Leaflet.                              |

Les briques sont aussi exportées séparément : `useStatusMap()` pilote la carte sans rendre
de conteneur, et `resolveWorstStatus`, `computeView`, `analyzeDataQuality`, `isLocated` sont
purs et testables hors DOM.

### Ce que le paquet ne fait pas

Il ne navigue pas, n'affiche aucune phrase qu'on ne lui a pas donnée, n'impose pas de fond
de carte et ne dessine pas d'icônes à votre place. Tout ce qui est visible vient des props.

---

## facet-filter

Un filtre à facettes dont chaque valeur annonce ce qu'elle ferait apparaître.

[Code du paquet](packages/facet-filter) · [Documentation](packages/facet-filter/README.md)

Le piège est toujours le même : compter les résultats **après** filtrage. Toutes
les valeurs non cochées de la facette en cours tombent alors à zéro,
l'utilisateur ne peut plus élargir sans d'abord décocher, et il se retrouve
enfermé dans son propre filtre.

Les comptes sont donc disjonctifs : pour chaque facette, on compte comme si elle
seule n'était pas cochée. La démo permet de basculer sur la version fautive pour
voir la différence en direct.

---

## before-after

Un comparateur avant / après dont le séparateur est un vrai curseur.

[Code du paquet](packages/before-after) · [Documentation](packages/before-after/README.md)

Tout le monde sait l'écrire en une soirée, et presque toutes les versions
écrites en une soirée partagent les deux mêmes défauts : un bloc qu'on traîne au
`pointermove` n'existe pas pour qui navigue au clavier, et rogner la couche du
dessus par sa largeur redimensionne l'image qu'elle contient — les deux côtés du
trait ne sont alors plus à la même échelle, et la comparaison ment.

Le séparateur est donc un `input[type=range]` transparent posé sur l'image : le
pointeur, le clavier, le rôle et la valeur annoncée viennent du navigateur, et
le composant n'écrit aucune gestion d'événement. Le rognage passe par
`clip-path`. Vient de
[prat-immobilier.fr](https://www.prat-immobilier.fr), où l'on montre une pièce
livrée brute puis la même meublée numériquement.

---

## Développement

```bash
npm install -g pnpm
pnpm install
pnpm dev
```

`pnpm check` enchaîne format, lint, types, tests et builds. C'est ce qui doit
passer avant chaque commit.

Voir [CLAUDE.md](CLAUDE.md) pour le contexte du projet et la direction
artistique, [ARCHITECTURE.md](ARCHITECTURE.md) pour les couches, et
[CONTRIBUTING.md](CONTRIBUTING.md) pour l'outillage et le déploiement.

## Licence

MIT
