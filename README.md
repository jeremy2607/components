# components

Bibliothèque de composants React, publiables indépendamment.

| Paquet                                          | Description                                                                     | État     |
| ----------------------------------------------- | ------------------------------------------------------------------------------- | -------- |
| [`@jeremyprat/status-map`](packages/status-map) | Carte Leaflet d'un parc de sites géolocalisés, regroupement coloré par sévérité | en cours |

---

## status-map

Une carte qui fait comprendre en deux secondes lesquels de vos sites vont mal.

**Démo en ligne : _(à remplir au déploiement)_** · [Code du paquet](packages/status-map) · [Code de la démo](apps/demo)

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

## Développement

```bash
npm install -g pnpm
pnpm install
pnpm dev
```

`pnpm check` enchaîne format, lint, types, tests et builds. C'est ce qui doit passer avant
chaque commit.

Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour les couches et l'ajout d'un statut, et
[CONTRIBUTING.md](CONTRIBUTING.md) pour l'outillage et le déploiement.

## Licence

MIT
