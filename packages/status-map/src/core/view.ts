import type { LatLngTuple, Located, PointTuple, StatusItem, ViewConfig } from './types';

export const DEFAULT_ZOOM = 5;
const DEFAULT_SINGLE_ITEM_ZOOM = 12;
const DEFAULT_PADDING: PointTuple = [48, 48];
const DEFAULT_FIT_MAX_ZOOM = 13;

/** Vrai si les coordonnées sont finies et dans les bornes géographiques. */
export function isLocated<T extends StatusItem<string, unknown>>(item: T): item is Located<T> {
  const { lat, lng } = item;
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export type ViewResolution =
  | { readonly kind: 'center'; readonly center: LatLngTuple; readonly zoom: number }
  | {
      readonly kind: 'bounds';
      readonly bounds: readonly LatLngTuple[];
      readonly padding: PointTuple;
      readonly maxZoom: number;
    };

function uniquePositions<K extends string, D>(items: readonly StatusItem<K, D>[]): LatLngTuple[] {
  const seen = new Set<string>();
  const positions: LatLngTuple[] = [];

  for (const item of items) {
    if (!isLocated(item)) continue;
    const key = `${item.lat},${item.lng}`;
    if (seen.has(key)) continue;
    seen.add(key);
    positions.push([item.lat, item.lng]);
  }

  return positions;
}

/**
 * Cascade de repli du cadrage initial.
 *
 * Aucune position exploitable  -> centre par défaut.
 * Une seule position distincte -> `setView` a zoom fixe. Un `fitBounds` sur un
 *   point unique, ou sur N éléments empilés aux mêmes coordonnées, part au zoom
 *   maximum et rend la carte illisible.
 * Plusieurs positions          -> cadrage sur l'ensemble, avec marge et plafond.
 */
export function computeView<K extends string, D>(
  items: readonly StatusItem<K, D>[],
  config: ViewConfig,
): ViewResolution {
  const positions = uniquePositions(items);
  const [first, second] = positions;

  if (!first) {
    return {
      kind: 'center',
      center: config.defaultCenter,
      zoom: config.defaultZoom ?? DEFAULT_ZOOM,
    };
  }

  if (!second) {
    return {
      kind: 'center',
      center: first,
      zoom: config.singleItemZoom ?? DEFAULT_SINGLE_ITEM_ZOOM,
    };
  }

  return {
    kind: 'bounds',
    bounds: positions,
    padding: config.padding ?? DEFAULT_PADDING,
    maxZoom: config.maxZoom ?? DEFAULT_FIT_MAX_ZOOM,
  };
}
