import type { TileConfig } from '@jeremyprat/status-map';

const key = import.meta.env.VITE_MAPTILER_KEY;

/**
 * OpenStreetMap, assombri par un filtre CSS.
 *
 * Aucune clé, aucun quota, aucun tiers à surveiller : les fonds sombres
 * gratuits n'existent plus vraiment, et en louer un pour une démo serait une
 * dépendance de plus à entretenir. Le filtre est posé sur la seule couche de
 * tuiles, donc les marqueurs et la bulle gardent leurs vraies couleurs.
 */
const OSM_SOMBRE: TileConfig = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  subdomains: 'abc',
  maxZoom: 19,
  className: 'tiles-dark',
};

/** Si une clé est fournie, le même parti pris en plus fin, et sans filtre. */
const MAPTILER: TileConfig = {
  url: `https://api.maptiler.com/maps/dataviz-dark/{z}/{x}/{y}{r}.png?key=${key ?? ''}`,
  attribution:
    '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 20,
};

export const tiles: TileConfig = key ? MAPTILER : OSM_SOMBRE;
