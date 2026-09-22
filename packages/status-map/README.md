# @jeremyprat/status-map

Carte Leaflet d'un parc de sites géolocalisés, dont le regroupement prend la couleur du
pire statut du groupe.

> En construction. Carte, cadrage et marqueurs sont en place ; clustering et popup arrivent.
> La documentation complète de l'API sera écrite une fois la surface publique figée.

## Installation

```bash
pnpm add @jeremyprat/status-map leaflet
```

`react`, `react-dom` et `leaflet` sont des dépendances de pair.

## Usage

```tsx
import { StatusMap } from '@jeremyprat/status-map';
import 'leaflet/dist/leaflet.css';
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

La feuille de style de Leaflet reste à la charge de l'application : le paquet ne
l'importe pas à votre place.

## Licence

MIT
