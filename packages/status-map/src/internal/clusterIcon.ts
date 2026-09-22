import type * as L from 'leaflet';
import { resolveWorstStatus } from '../core/severity';
import type { StatusDefinition, StatusRegistry } from '../core/types';
import { sanitizeKey } from './keys';
import { createLabelledDivIcon } from './labelledIcon';
import { cssValue } from './markerIcon';

/** Trois paliers de taille : un groupe de mille doit se voir plus qu'un groupe de trois. */
function clusterSize(count: number): number {
  if (count < 10) return 38;
  if (count < 100) return 46;
  return 54;
}

export interface ClusterIconOptions<K extends string> {
  cluster: L.MarkerCluster;
  statuses: StatusRegistry<K>;
  label: (count: number, status: StatusDefinition, key: K) => string;
}

/**
 * Icône d'un regroupement, colorée par le statut le plus grave qu'il contient.
 *
 * La gravité se lit sur les marqueurs, dans `marker.options.status`, puis dans
 * `statuses[clé].severity`. Aucun nom de classe CSS n'est interrogé, et les
 * classes produites sont les nôtres : le greffon garde ses
 * `marker-cluster-small` et consorts, nous n'y touchons pas.
 */
export function createClusterIcon<K extends string>({
  cluster,
  statuses,
  label,
}: ClusterIconOptions<K>): L.DivIcon {
  const children = cluster.getAllChildMarkers();
  const worstKey = resolveWorstStatus(
    children.map((marker) => marker.options.status),
    statuses,
  );

  const count = cluster.getChildCount();
  const size = clusterSize(count);
  const definition = worstKey ? statuses[worstKey] : null;

  const modifier = worstKey ? ` sm-cluster--${sanitizeKey(worstKey)}` : '';
  const color = definition ? `--sm-cluster-color:${cssValue(definition.color)}` : '';

  return createLabelledDivIcon({
    className: `sm-cluster${modifier}`,
    html: `<span class="sm-cluster__body" style="${color}"><span class="sm-cluster__count">${count}</span></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    label: definition && worstKey ? label(count, definition, worstKey) : String(count),
  });
}
