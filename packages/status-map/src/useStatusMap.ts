import * as L from 'leaflet';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { analyzeDataQuality } from './core/dataQuality';
import { computeView, DEFAULT_ZOOM } from './core/view';
import type { DataQualityReport, StatusItem, TileConfig, ViewConfig } from './core/types';
import { useLatest } from './internal/useLatest';
import { useLeafletMap } from './internal/useLeafletMap';

export interface UseStatusMapOptions<K extends string = string, D = unknown> {
  items: readonly StatusItem<K, D>[];
  tiles: TileConfig;
  view: ViewConfig;
  /** Cadre sur les éléments géolocalisés à la première mesure du conteneur. Défaut : true. */
  fitOnLoad?: boolean;
  onDataQuality?: (report: DataQualityReport) => void;
  /** Échappatoire : options Leaflet brutes, lues à la création. */
  mapOptions?: L.MapOptions;
  onReady?: (map: L.Map) => void;
}

export interface UseStatusMapResult {
  containerRef: (node: HTMLDivElement | null) => void;
  map: L.Map | null;
  dataQuality: DataQualityReport;
  /** Recadre depuis les éléments courants. */
  fit: () => void;
  invalidateSize: () => void;
}

/**
 * Version sans rendu : pilote la carte et rend la main sur l'instance Leaflet.
 * `StatusMap` n'en est que l'emballage.
 */
export function useStatusMap<K extends string = string, D = unknown>(
  options: UseStatusMapOptions<K, D>,
): UseStatusMapResult {
  const { items, tiles, view, fitOnLoad = true, onDataQuality, mapOptions, onReady } = options;

  const itemsRef = useLatest(items);
  const viewRef = useLatest(view);
  const hasFitted = useRef(false);

  const { containerRef, map, mapRef } = useLeafletMap({
    tiles,
    initialCenter: view.defaultCenter,
    initialZoom: view.defaultZoom ?? DEFAULT_ZOOM,
    mapOptions,
    /*
     * Premier cadrage à la première mesure non nulle, jamais avant : un
     * conteneur de taille zéro fait cadrer Leaflet sur une fenêtre vide.
     * Remplace le setTimeout de contournement.
     */
    onMeasure: () => {
      if (hasFitted.current || !fitOnLoad) return;
      hasFitted.current = true;
      fit();
    },
  });

  const fit = useCallback(() => {
    const instance = mapRef.current;
    if (!instance) return;

    const resolution = computeView(itemsRef.current, viewRef.current);

    if (resolution.kind === 'center') {
      instance.setView([resolution.center[0], resolution.center[1]], resolution.zoom);
      return;
    }

    const bounds = L.latLngBounds(resolution.bounds.map(([lat, lng]) => L.latLng(lat, lng)));
    instance.fitBounds(bounds, {
      padding: [resolution.padding[0], resolution.padding[1]],
      maxZoom: resolution.maxZoom,
    });
  }, [mapRef, itemsRef, viewRef]);

  const invalidateSize = useCallback(() => {
    mapRef.current?.invalidateSize();
  }, [mapRef]);

  const onReadyRef = useLatest(onReady);
  useEffect(() => {
    if (map) onReadyRef.current?.(map);
  }, [map, onReadyRef]);

  const dataQuality = useMemo(() => analyzeDataQuality(items), [items]);
  const dataQualityRef = useLatest(dataQuality);
  const onDataQualityRef = useLatest(onDataQuality);

  // Signature de valeur : le rapport est un objet neuf à chaque rendu, seul son
  // contenu doit déclencher un nouvel avertissement.
  const qualitySignature = `${dataQuality.total}|${dataQuality.located}|${dataQuality.missingIds.join(',')}`;
  useEffect(() => {
    onDataQualityRef.current?.(dataQualityRef.current);
  }, [qualitySignature, onDataQualityRef, dataQualityRef]);

  return { containerRef, map, dataQuality, fit, invalidateSize };
}
