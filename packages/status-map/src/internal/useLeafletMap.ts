import * as L from 'leaflet';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LatLngTuple, TileConfig } from '../core/types';
import { useLatest } from './useLatest';

export interface UseLeafletMapOptions {
  tiles: TileConfig;
  /** Vue posee à la création. Leaflet refuse toute couche sans centre ni zoom. */
  initialCenter: LatLngTuple;
  initialZoom: number;
  mapOptions?: L.MapOptions;
  /** Appelé à chaque mesure non nulle du conteneur, apres `invalidateSize`. */
  onMeasure?: () => void;
}

export interface UseLeafletMapResult {
  containerRef: (node: HTMLDivElement | null) => void;
  map: L.Map | null;
}

/**
 * Cycle de vie Leaflet : création, fond de carte, redimensionnement, destruction.
 *
 * Le conteneur passe par un état plutôt qu'une ref, pour que l'effet de création
 * se déclenche à la mesure exacte où le nœud entre dans le DOM.
 */
export function useLeafletMap(options: UseLeafletMapOptions): UseLeafletMapResult {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  // Lues une seule fois : changer ces valeurs ne recréé pas la carte.
  const creationRef = useRef({
    center: options.initialCenter,
    zoom: options.initialZoom,
    mapOptions: options.mapOptions,
  });
  const tilesRef = useLatest(options.tiles);
  const onMeasureRef = useLatest(options.onMeasure);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  useEffect(() => {
    if (!container) return;

    const { center, zoom, mapOptions } = creationRef.current;
    const instance = L.map(container, { ...mapOptions, center: [center[0], center[1]], zoom });
    setMap(instance);

    return () => {
      instance.remove();
      setMap(null);
    };
  }, [container]);

  // Clé de valeur : le fond est recréé dès qu'un champ change, sans obliger
  // l'appelant à mémoriser l'objet `tiles`.
  const { url, attribution, subdomains, maxZoom, minZoom, className } = options.tiles;
  const tilesKey = JSON.stringify([url, attribution, subdomains, maxZoom, minZoom, className]);

  useEffect(() => {
    if (!map) return;

    const tiles = tilesRef.current;
    const layer = L.tileLayer(tiles.url, {
      attribution: tiles.attribution,
      subdomains: tiles.subdomains ?? 'abc',
      maxZoom: tiles.maxZoom,
      minZoom: tiles.minZoom,
      className: tiles.className,
    });
    layer.addTo(map);

    return () => {
      layer.remove();
    };
  }, [map, tilesKey, tilesRef]);

  useEffect(() => {
    if (!map || !container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return;

      map.invalidateSize();
      onMeasureRef.current?.();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [map, container, onMeasureRef]);

  return { containerRef, map };
}
