import type { TileConfig } from '@jeremyprat/status-map';

const key = import.meta.env.VITE_MAPTILER_KEY;

const OSM: TileConfig = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  subdomains: 'abc',
  maxZoom: 19,
};

/**
 * Fond sobre et sans libellés pour que les marqueurs restent lisibles.
 * La clé reste hors du dépôt ; sans elle, repli sur OpenStreetMap.
 */
const MAPTILER: TileConfig = {
  url: `https://api.maptiler.com/maps/dataviz-light/{z}/{x}/{y}{r}.png?key=${key ?? ''}`,
  attribution:
    '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 20,
};

export const tiles: TileConfig = key ? MAPTILER : OSM;
