# @jeremyprat/status-map

Carte Leaflet d'un parc de sites géolocalisés, dont le regroupement prend la couleur du
pire statut du groupe.

> En construction. Carte, cadrage, marqueurs et regroupement sont en place ; le popup arrive.
> La documentation complète de l'API sera écrite une fois la surface publique figée.

## Installation

```bash
pnpm add @jeremyprat/status-map leaflet leaflet.markercluster
```

`react`, `react-dom`, `leaflet` et `leaflet.markercluster` sont des dépendances de pair.

## Usage

```tsx
import { StatusMap } from '@jeremyprat/status-map';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import '@jeremyprat/status-map/styles.css';

<StatusMap
  items={items}
  statuses={{
    ok: { color: '#1ED760', severity: 0, label: 'en service', icon: <CheckPath /> },
    offline: { color: '#FF4E5E', severity: 2, label: 'hors ligne', icon: <OfflinePath /> },
  }}
  tiles={{ url, attribution }}
  view={{ defaultCenter: [46.6, 2.4], defaultZoom: 6 }}
/>;
```

`severity` classe les statuts : plus la valeur est haute, plus le statut est grave. C'est la
seule source de vérité pour la couleur d'un regroupement. `icon` est du contenu SVG dessiné
dans une boîte de 24 par 24, rendu une seule fois par statut dans un sprite, puis instancié
par référence sur chaque marqueur.

Les feuilles de Leaflet et du greffon restent à la charge de l'application : le paquet ne
les importe pas à votre place. `MarkerCluster.css` ne contient que les transitions de
regroupement ; `MarkerCluster.Default.css` n'est pas nécessaire, c'est l'apparence par
défaut du greffon, que `status-map` remplace.

## Le regroupement coloré par sévérité

Un groupe prend la couleur du pire statut qu'il contient. La sévérité se lit sur les
marqueurs, dans `marker.options.status`, puis dans `statuses[clé].severity` : la couleur
est une conséquence de la donnée, jamais une lecture de nom de classe CSS. Les classes
produites sont `sm-cluster--<clé>`, distinctes des paliers de comptage du greffon, qui
restent intacts.

Quand un statut change, `status-map` appelle `refreshClusters()` sur les seuls groupes
touchés : les icônes de regroupement ne se recalculent pas d'elles-mêmes.

## Licence

MIT
