# @jeremyprat/status-map

Carte Leaflet d'un parc de sites géolocalisés, dont le regroupement prend la couleur du
pire statut du groupe.

> En construction. Carte, cadrage, marqueurs, regroupement et bulle sont en place.
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

## Le fond de carte

`tiles` prend deux formes. Un gabarit d'URL, pour des tuiles raster :

```tsx
tiles={{ url: 'https://{s}.tile.example.org/{z}/{x}/{y}.png', attribution: '…' }}
```

Ou une fabrique de couche, pour tout le reste, y compris un fond vectoriel :

```tsx
tiles={{ create: () => maplibreGL({ style }), maxZoom: 19 }}
```

`maxZoom` est requis sous cette forme : une couche quelconque ne le déclare pas forcément à
la carte, et le regroupement refuse de démarrer sur un zoom maximum infini.

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

## La bulle au survol

`renderPopup` reçoit l'élément et rend du JSX. Le contenu est monté par `createPortal` dans
un conteneur que le paquet possède, jamais posé en `innerHTML` : les gestionnaires
d'événements, les liens de routeur et le contexte React y vivent normalement.

Une seule instance de bulle sert toute la carte. Trois cents marqueurs ne justifient pas
trois cents `bindPopup`, et le décalage vertical se calcule depuis la taille du marqueur.

Le curseur doit pouvoir traverser le vide entre le marqueur et la bulle. À la sortie du
marqueur, la fermeture est programmée à 200 ms, sauf si le curseur est déjà entré dans la
bulle ; la bulle écoute de son côté et annule la fermeture si le curseur l'atteint à temps.
`autoPan` est à `false` : une bulle qui déplace la carte sous un curseur en survol la fait
fuir. En contrepartie, une bulle ouverte près d'un bord est découpée par le conteneur.

Un clic sur un marqueur appelle `onSelect(item)`. Le composant ne navigue jamais lui-même.

## Licence

MIT
