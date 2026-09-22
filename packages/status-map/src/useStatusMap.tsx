import * as L from 'leaflet';
import { useCallback, useEffect, useId, useMemo, useRef, type ReactNode } from 'react';
import { analyzeDataQuality } from './core/dataQuality';
import { computeView, DEFAULT_ZOOM } from './core/view';
import type {
  AnyStatusItem,
  ClusterConfig,
  DataQualityReport,
  MarkerConfig,
  PopupConfig,
  PopupContext,
  StatusDefinition,
  StatusItem,
  StatusMapLabels,
  StatusRegistry,
  TileConfig,
  ViewConfig,
} from './core/types';
import { IconSprite } from './internal/IconSprite';
import { useLatest } from './internal/useLatest';
import { useLeafletMap } from './internal/useLeafletMap';
import { useMarkerLayer } from './internal/useMarkerLayer';
import { usePopup } from './internal/usePopup';

const DEFAULT_MARKER_SIZE = 36;

export interface UseStatusMapOptions<T extends AnyStatusItem = StatusItem> {
  items: readonly T[];
  statuses: StatusRegistry<T['status']>;
  tiles: TileConfig;
  view: ViewConfig;
  /** Cadre sur les éléments géolocalisés à la première mesure du conteneur. Défaut : true. */
  fitOnLoad?: boolean;
  cluster?: ClusterConfig;
  marker?: MarkerConfig;
  popup?: PopupConfig;
  labels?: StatusMapLabels<T>;
  /**
   * Contenu de la bulle. Sans cette prop, aucune bulle n'est montée.
   * Le rendu est monté par portail : JSX, gestionnaires et contexte React y vivent.
   */
  renderPopup?: (item: T, context: PopupContext<T['status']>) => ReactNode;
  /** Clic sur un marqueur. Le composant ne navigue jamais de lui-même. */
  onSelect?: (item: T, event: L.LeafletMouseEvent) => void;
  /**
   * Sélection pilotée de l'extérieur. Le marqueur est mis en valeur, et ramené
   * à l'écran s'il est hors cadre ou pris dans un regroupement.
   */
  selectedId?: string | null;
  /** Transmise à `renderPopup`, pour tout formatage sensible à la langue. */
  locale?: string;
  onDataQuality?: (report: DataQualityReport) => void;
  /** Échappatoire : options Leaflet brutes, lues à la création. */
  mapOptions?: L.MapOptions;
  onReady?: (map: L.Map) => void;
}

export interface UseStatusMapResult {
  containerRef: (node: HTMLDivElement | null) => void;
  map: L.Map | null;
  /** Sprite des icônes, à rendre une fois à côté du conteneur. */
  sprite: ReactNode;
  /** Portail de la bulle, à rendre une fois à côté du conteneur. */
  popup: ReactNode;
  dataQuality: DataQualityReport;
  /** Recadre depuis les éléments courants. */
  fit: () => void;
  invalidateSize: () => void;
}

/** Aucune prose : une interpolation des données du consommateur. */
function defaultMarkerLabel<T extends AnyStatusItem>(
  item: T,
  status: StatusDefinition,
  key: T['status'],
): string {
  return `${item.id} - ${status.label ?? key}`;
}

function defaultClusterLabel(count: number, status: StatusDefinition, key: string): string {
  return `${count} - ${status.label ?? key}`;
}

/**
 * Version sans rendu : pilote la carte et rend la main sur l'instance Leaflet.
 * `StatusMap` n'en est que l'emballage.
 */
export function useStatusMap<T extends AnyStatusItem = StatusItem>(
  options: UseStatusMapOptions<T>,
): UseStatusMapResult {
  const {
    items,
    statuses,
    tiles,
    view,
    fitOnLoad = true,
    cluster,
    marker,
    popup,
    renderPopup,
    onSelect,
    selectedId,
    locale,
    labels,
    onDataQuality,
    mapOptions,
    onReady,
  } = options;

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

  // Identifiants de symboles propres à cette carte : plusieurs cartes sur une
  // même page ne doivent pas se voler leurs icônes.
  const uid = useId().replace(/:/g, '');
  const statusKeys = Object.keys(statuses) as T['status'][];
  const statusSignature = JSON.stringify(
    statusKeys.map((key) => [
      key,
      statuses[key].color,
      statuses[key].severity,
      statuses[key].label,
    ]),
  );
  const symbolIds = Object.fromEntries(
    statusKeys.map((key, index) => [key, `sm-${uid}-${index}`]),
  ) as Record<T['status'], string>;

  const clusterSignature = JSON.stringify([
    cluster?.enabled,
    cluster?.maxRadius,
    cluster?.spiderfyOnMaxZoom,
    cluster?.spiderfyDistanceMultiplier,
    cluster?.showCoverageOnHover,
    cluster?.removeOutsideVisibleBounds,
    cluster?.zoomToBoundsOnClick,
    cluster?.disableClusteringAtZoom,
    cluster?.spiderLegPolylineOptions,
  ]);

  const markerSize = marker?.size ?? DEFAULT_MARKER_SIZE;

  const bubble = usePopup<T>({
    map,
    mapRef,
    items,
    statuses,
    render: renderPopup,
    config: popup,
    markerSize,
    locale,
  });

  const onSelectRef = useLatest(onSelect);

  useMarkerLayer({
    map,
    mapRef,
    items,
    statuses,
    symbolIds,
    size: markerSize,
    cluster,
    selectedId,
    statusSignature,
    clusterSignature,
    markerLabel: labels?.marker ?? defaultMarkerLabel,
    clusterLabel: labels?.cluster ?? defaultClusterLabel,
    onMarkerEnter: renderPopup ? bubble.open : undefined,
    onMarkerLeave: renderPopup ? bubble.scheduleClose : undefined,
    onMarkerSelect: (item, event) => onSelectRef.current?.(item, event),
  });

  const sprite = <IconSprite statuses={statuses} symbolIds={symbolIds} />;

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

  return { containerRef, map, sprite, popup: bubble.node, dataQuality, fit, invalidateSize };
}
