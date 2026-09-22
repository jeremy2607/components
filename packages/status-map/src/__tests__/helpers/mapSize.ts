import type * as L from 'leaflet';

/**
 * Donne une taille au conteneur.
 *
 * jsdom ne met rien en page : `clientWidth` et `clientHeight` valent zéro, donc
 * Leaflet croit la carte invisible et le regroupement retire tout ce qu'il
 * juge hors cadre.
 */
export function giveMapASize(map: L.Map, width = 800, height = 600): void {
  const container = map.getContainer();
  Object.defineProperty(container, 'clientWidth', { value: width, configurable: true });
  Object.defineProperty(container, 'clientHeight', { value: height, configurable: true });
  map.invalidateSize();
}
