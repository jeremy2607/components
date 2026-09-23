import * as L from 'leaflet';
import 'leaflet.markercluster';

type ClusterFactory = (options?: L.MarkerClusterGroupOptions) => L.MarkerClusterGroup;

function factoryOf(candidate: unknown): ClusterFactory | null {
  const owner = candidate as { markerClusterGroup?: unknown } | null | undefined;
  return typeof owner?.markerClusterGroup === 'function'
    ? (owner.markerClusterGroup as ClusterFactory)
    : null;
}

/**
 * Résout la fabrique du greffon, au moment de l'appel.
 *
 * `leaflet.markercluster` n'importe pas Leaflet : il augmente un `L` libre,
 * donc le global. Or Leaflet 1.9 ne publie que du CommonJS, et un empaqueteur
 * fabrique alors pour `import * as L` une copie de ses exports. L'augmentation
 * du greffon n'arrive jamais dans cette copie, et l'appel échoue en build de
 * production alors qu'il passait en développement.
 *
 * On lit donc là où le greffon a réellement écrit, plutôt que de supposer
 * qu'il n'existe qu'un seul objet Leaflet.
 */
export function resolveClusterFactory(): ClusterFactory {
  const factory = factoryOf(L) ?? factoryOf((globalThis as { L?: unknown }).L);
  if (factory) return factory;

  throw new Error(
    'leaflet.markercluster est introuvable. Installez-le et importez-le, ou passez cluster={{ enabled: false }}.',
  );
}
