import type { BasemapConfig } from '@jeremyprat/status-map';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { setWorkerUrl } from 'maplibre-gl';
// L'empaqueteur émet le worker comme un fichier à part, et nous rend son URL.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

/*
 * MapLibre déduit l'URL de son worker de sa propre URL de module. Empaqueté
 * dans le fichier de l'application, ce raisonnement pointe dans le vide et la
 * carte reste blanche. On la lui donne.
 */
setWorkerUrl(workerUrl);

/**
 * Fond vectoriel OpenFreeMap.
 *
 * Données OpenStreetMap, schéma OpenMapTiles, aucune clé et aucune inscription.
 * Le style « positron » est sobre et peu bavard, ce qui laisse les marqueurs
 * colorés ressortir : sur une carte de supervision, le fond ne doit pas
 * concourir avec l'information.
 *
 * Pour un autre rendu, seule cette URL change : bright, liberty, dark, fiord,
 * ou n'importe quel style au schéma OpenMapTiles hébergé ailleurs.
 *
 * La fabrique est importée nommément plutôt que lue sur `L.maplibreGL` : le
 * greffon augmente aussi l'objet Leaflet, et cet objet n'est pas le même selon
 * l'empaqueteur.
 */
const STYLE = 'https://tiles.openfreemap.org/styles/positron';

/*
 * Aucune attribution n'est passée ici : la couche MapLibre publie déjà celle
 * que le style déclare, et la redonner l'afficherait deux fois.
 */
export const tiles: BasemapConfig = {
  create: () => maplibreGL({ style: STYLE }),
  maxZoom: 19,
};
