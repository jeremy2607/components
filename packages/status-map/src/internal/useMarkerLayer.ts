import * as L from 'leaflet';
import 'leaflet.markercluster';
import { useEffect, useRef } from 'react';
import type {
  AnyStatusItem,
  ClusterConfig,
  StatusDefinition,
  StatusLookup,
  StatusRegistry,
} from '../core/types';
import { isLocated } from '../core/view';
import { createClusterIcon } from './clusterIcon';
import { createStatusIcon } from './markerIcon';
import { definedOnly } from './options';
import { useLatest } from './useLatest';

export interface UseMarkerLayerOptions<T extends AnyStatusItem> {
  /** Instance vivante, pour ne jamais toucher une carte détruite. */
  mapRef: { readonly current: L.Map | null };
  /** Déclencheur de rendu : change quand la carte est recréée. */
  map: L.Map | null;
  items: readonly T[];
  statuses: StatusRegistry<T['status']>;
  symbolIds: Readonly<Record<T['status'], string>>;
  size: number;
  cluster: ClusterConfig | undefined;
  /** Sélection pilotée de l'extérieur : met en valeur et ramène à l'écran. */
  selectedId: string | null | undefined;
  /** Signatures de valeur, pour ne rebâtir qu'à un vrai changement. */
  statusSignature: string;
  clusterSignature: string;
  markerLabel: (item: T, status: StatusDefinition, key: T['status']) => string;
  clusterLabel: (count: number, status: StatusDefinition, key: T['status']) => string;
  onMarkerEnter?: (item: T, position: L.LatLng) => void;
  onMarkerLeave?: (relatedTarget: EventTarget | null) => void;
  onMarkerSelect?: (item: T, event: L.LeafletMouseEvent) => void;
}

function isClusterGroup(group: L.LayerGroup): group is L.MarkerClusterGroup {
  return 'refreshClusters' in group;
}

/**
 * Maintient un marqueur par élément géolocalisé, regroupé ou non.
 *
 * Les marqueurs sont réconciliés, pas reconstruits : un changement de statut
 * remplace l'icône du marqueur existant. Sans cela, le mode temps réel ferait
 * clignoter le parc entier toutes les deux secondes.
 */
export function useMarkerLayer<T extends AnyStatusItem>(options: UseMarkerLayerOptions<T>): void {
  const { map, mapRef, items, size, statusSignature, clusterSignature, selectedId } = options;

  const groupRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());
  /** Dernier état connu de chaque élément : les gestionnaires posés une fois doivent le relire. */
  const itemsRef = useRef(new Map<string, T>());
  /** Dernier nom accessible posé, pour ne refabriquer l'icône qu'à un vrai changement. */
  const labelsRef = useRef(new Map<string, string>());
  const lastStatusSignature = useRef(statusSignature);
  const lastSelectedId = useRef<string | null>(null);

  const statusesRef = useLatest(options.statuses);
  const symbolIdsRef = useLatest(options.symbolIds);
  const clusterRef = useLatest(options.cluster);
  const markerLabelRef = useLatest(options.markerLabel);
  const clusterLabelRef = useLatest(options.clusterLabel);
  const onEnterRef = useLatest(options.onMarkerEnter);
  const onLeaveRef = useLatest(options.onMarkerLeave);
  const onSelectRef = useLatest(options.onMarkerSelect);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;

    const config = clusterRef.current ?? {};
    const markers = markersRef.current;
    const labels = labelsRef.current;
    const knownItems = itemsRef.current;

    const group =
      config.enabled === false
        ? L.layerGroup()
        : L.markerClusterGroup(
            definedOnly<L.MarkerClusterGroupOptions>({
              animate: true,
              maxClusterRadius: config.maxRadius ?? 80,
              spiderfyOnMaxZoom: config.spiderfyOnMaxZoom ?? true,
              spiderfyDistanceMultiplier: config.spiderfyDistanceMultiplier ?? 3,
              showCoverageOnHover: config.showCoverageOnHover ?? false,
              removeOutsideVisibleBounds: config.removeOutsideVisibleBounds ?? true,
              zoomToBoundsOnClick: config.zoomToBoundsOnClick ?? true,
              disableClusteringAtZoom: config.disableClusteringAtZoom,
              spiderLegPolylineOptions: config.spiderLegPolylineOptions,
              // Lit les refs : le registre peut changer sans rebâtir le groupe.
              iconCreateFunction: (cluster) =>
                createClusterIcon({
                  cluster,
                  statuses: statusesRef.current,
                  label: clusterLabelRef.current,
                }),
            }),
          );

    group.addTo(instance);
    groupRef.current = group;

    return () => {
      group.clearLayers();
      group.remove();
      groupRef.current = null;
      markers.clear();
      labels.clear();
      knownItems.clear();
    };
  }, [map, mapRef, clusterSignature, clusterRef, statusesRef, clusterLabelRef]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const registry: StatusLookup = statusesRef.current;
    const symbols: Readonly<Record<string, string | undefined>> = symbolIdsRef.current;
    const previous = markersRef.current;
    const labels = labelsRef.current;
    const knownItems = itemsRef.current;
    const next = new Map<string, L.Marker>();
    const restyled: L.Marker[] = [];

    for (const item of items) {
      if (!isLocated(item)) continue;

      const definition = registry[item.status];
      if (!definition) continue;

      const label = markerLabelRef.current(item, definition, item.status);
      const selected = item.id === selectedId;
      const icon = () =>
        createStatusIcon({
          statusKey: item.status,
          definition,
          symbolId: definition.icon ? (symbols[item.status] ?? null) : null,
          size,
          label,
          selected,
        });

      const position = L.latLng(item.lat, item.lng);
      const existing = previous.get(item.id);
      knownItems.set(item.id, item);

      if (existing) {
        previous.delete(item.id);
        next.set(item.id, existing);

        if (!existing.getLatLng().equals(position)) existing.setLatLng(position);

        const statusChanged = existing.options.status !== item.status;
        const wasSelected = item.id === lastSelectedId.current;

        if (statusChanged || labels.get(item.id) !== label || wasSelected !== selected) {
          existing.options.status = item.status;
          labels.set(item.id, label);
          existing.setIcon(icon());
          // Seul un changement de statut peut changer la couleur d'un groupe.
          if (statusChanged) restyled.push(existing);
        }
        continue;
      }

      const marker = L.marker(position, { icon: icon(), status: item.status, keyboard: true });
      labels.set(item.id, label);

      /*
       * Gestionnaires posés une seule fois par marqueur, qui relisent l'élément
       * courant : les remplacer à chaque rendu rebrancherait trois cents
       * écouteurs pour rien.
       */
      const { id } = item;
      marker.on('mouseover', () => {
        const current = knownItems.get(id);
        if (current) onEnterRef.current?.(current, marker.getLatLng());
      });
      marker.on('mouseout', (event: L.LeafletMouseEvent) => {
        onLeaveRef.current?.(event.originalEvent.relatedTarget);
      });
      marker.on('click', (event: L.LeafletMouseEvent) => {
        const current = knownItems.get(id);
        if (current) onSelectRef.current?.(current, event);
      });

      group.addLayer(marker);
      next.set(item.id, marker);
    }

    lastSelectedId.current = selectedId ?? null;

    for (const [id, marker] of previous) {
      marker.off();
      group.removeLayer(marker);
      labels.delete(id);
      knownItems.delete(id);
    }
    markersRef.current = next;

    /*
     * Les icônes de regroupement ne se recalculent pas seules : changer
     * l'icône d'un marqueur laisse son groupe à l'ancienne couleur. Un
     * changement de registre touche tous les groupes, un changement de statut
     * seulement ceux qui contiennent les marqueurs concernés.
     */
    if (!isClusterGroup(group)) return;

    if (lastStatusSignature.current !== statusSignature) {
      lastStatusSignature.current = statusSignature;
      group.refreshClusters();
      return;
    }

    if (restyled.length > 0) group.refreshClusters(restyled);
  }, [
    map,
    items,
    size,
    selectedId,
    statusSignature,
    statusesRef,
    symbolIdsRef,
    markerLabelRef,
    clusterSignature,
    onEnterRef,
    onLeaveRef,
    onSelectRef,
  ]);

  /*
   * Une sélection venue du panneau doit être visible. Un marqueur pris dans un
   * regroupement n'est pas dans le DOM : il faut déplier, pas seulement
   * déplacer. Un marqueur déjà à l'écran n'est pas touché, sinon cliquer sur la
   * carte ferait bouger la carte sous le doigt.
   */
  useEffect(() => {
    const instance = mapRef.current;
    const group = groupRef.current;
    if (!instance || !group || !selectedId) return;

    const marker = markersRef.current.get(selectedId);
    if (!marker) return;

    if (isClusterGroup(group) && !instance.hasLayer(marker)) {
      group.zoomToShowLayer(marker);
      return;
    }

    if (!instance.getBounds().contains(marker.getLatLng())) instance.panTo(marker.getLatLng());
  }, [map, mapRef, selectedId]);

  /*
   * Chemin clavier vers la bulle.
   *
   * Leaflet rend les marqueurs navigables au tabulateur, mais une bulle qui ne
   * s'ouvre qu'au survol reste hors d'atteinte sans souris. La délégation sur
   * le conteneur survit à la recréation des éléments par le regroupement, et
   * le marqueur est retrouvé par identité d'élément : rien n'est stocké dans
   * le DOM pour ça.
   */
  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;

    const container = instance.getContainer();
    const knownItems = itemsRef.current;

    const entryAt = (target: EventTarget | null): [string, L.Marker] | null => {
      if (!(target instanceof Element)) return null;

      const element = target.closest('.sm-marker');
      if (!element) return null;

      for (const entry of markersRef.current) {
        if (entry[1].getElement() === element) return entry;
      }
      return null;
    };

    const onFocus = (event: FocusEvent) => {
      const entry = entryAt(event.target);
      if (!entry) return;

      const item = knownItems.get(entry[0]);
      if (item) onEnterRef.current?.(item, entry[1].getLatLng());
    };

    const onBlur = (event: FocusEvent) => {
      if (!entryAt(event.target)) return;
      onLeaveRef.current?.(event.relatedTarget);
    };

    container.addEventListener('focusin', onFocus);
    container.addEventListener('focusout', onBlur);

    return () => {
      container.removeEventListener('focusin', onFocus);
      container.removeEventListener('focusout', onBlur);
    };
  }, [map, mapRef, onEnterRef, onLeaveRef]);
}
