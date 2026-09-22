# @jeremyprat/status-map

Carte Leaflet d'un parc de sites géolocalisés, dont le regroupement prend la couleur du
pire statut du groupe.

> En construction. Le socle carte est en place ; marqueurs, clustering et popup arrivent.
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
  tiles={{ url, attribution }}
  view={{ defaultCenter: [46.6, 2.4], defaultZoom: 6 }}
/>;
```

La feuille de style de Leaflet reste à la charge de l'application : le paquet ne
l'importe pas à votre place.

## Licence

MIT
