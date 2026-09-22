import * as L from 'leaflet';
import { useEffect, useRef } from 'react';
import type { StatusDefinition, StatusItem, StatusRegistry } from '../core/types';
import { isLocated } from '../core/view';
import { useLatest } from './useLatest';
import { createStatusIcon } from './markerIcon';

export interface UseMarkerLayerOptions<K extends string, D> {
  /** Instance vivante, pour ne jamais toucher une carte détruite. */
  mapRef: { readonly current: L.Map | null };
  /** Déclencheur de rendu : change quand la carte est recréée. */
  map: L.Map | null;
  items: readonly StatusItem<K, D>[];
  statuses: StatusRegistry<K>;
  symbolIds: Readonly<Record<K, string>>;
  size: number;
  /** Signature de valeur du registre, pour ne redessiner qu'à un vrai changement. */
  statusSignature: string;
  label: (item: StatusItem<K, D>, status: StatusDefinition, key: K) => string;
}

function applyLabel(marker: L.Marker, label: string): void {
  const element = marker.getElement();
  if (!element) return;

  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', label);
}

/**
 * Maintient un marqueur par élément géolocalisé.
 *
 * Les marqueurs sont réconciliés, pas reconstruits : un changement de statut
 * remplace l'icône du marqueur existant. Sans cela, le mode temps réel ferait
 * clignoter le parc entier toutes les deux secondes.
 */
export function useMarkerLayer<K extends string, D>(options: UseMarkerLayerOptions<K, D>): void {
  const { map, mapRef, items, statuses, symbolIds, size, statusSignature } = options;

  const groupRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());
  const labelsRef = useRef(new Map<string, string>());
  const labelRef = useLatest(options.label);
  const statusesRef = useLatest(statuses);
  const symbolIdsRef = useLatest(symbolIds);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;

    const group = L.layerGroup().addTo(instance);
    const markers = markersRef.current;
    const labels = labelsRef.current;
    groupRef.current = group;

    return () => {
      group.clearLayers();
      group.remove();
      groupRef.current = null;
      markers.clear();
      labels.clear();
    };
  }, [map, mapRef]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const registry = statusesRef.current;
    const symbols = symbolIdsRef.current;
    const previous = markersRef.current;
    const next = new Map<string, L.Marker>();
    const labels = labelsRef.current;

    for (const item of items) {
      if (!isLocated(item)) continue;

      const definition = registry[item.status];
      if (!definition) continue;

      const label = labelRef.current(item, definition, item.status);
      labels.set(item.id, label);

      const position = L.latLng(item.lat, item.lng);
      const existing = previous.get(item.id);

      if (existing) {
        previous.delete(item.id);
        next.set(item.id, existing);

        if (!existing.getLatLng().equals(position)) existing.setLatLng(position);

        if (existing.options.status !== item.status) {
          existing.options.status = item.status;
          existing.setIcon(
            createStatusIcon({
              statusKey: item.status,
              definition,
              symbolId: definition.icon ? symbols[item.status] : null,
              size,
            }),
          );
        }

        applyLabel(existing, label);
        continue;
      }

      const marker = L.marker(position, {
        icon: createStatusIcon({
          statusKey: item.status,
          definition,
          symbolId: definition.icon ? symbols[item.status] : null,
          size,
        }),
        status: item.status,
        keyboard: true,
      });

      // Le regroupement retire puis rajoute les marqueurs : le nom accessible
      // doit être reposé à chaque entrée dans le DOM.
      marker.on('add', () => {
        const current = labels.get(item.id);
        if (current) applyLabel(marker, current);
      });

      group.addLayer(marker);
      applyLabel(marker, label);
      next.set(item.id, marker);
    }

    for (const [id, marker] of previous) {
      group.removeLayer(marker);
      labels.delete(id);
    }

    markersRef.current = next;
  }, [map, items, size, statusSignature, statusesRef, symbolIdsRef, labelRef]);
}
