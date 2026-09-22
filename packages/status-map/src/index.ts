export { StatusMap, type StatusMapProps } from './StatusMap';
export { useStatusMap, type UseStatusMapOptions, type UseStatusMapResult } from './useStatusMap';

export { analyzeDataQuality } from './core/dataQuality';
export { resolveWorstStatus } from './core/severity';
export { computeView, isLocated, type ViewResolution } from './core/view';

export type {
  ClusterConfig,
  DataQualityReport,
  LatLngTuple,
  Located,
  LocatedItem,
  MarkerConfig,
  PointTuple,
  StatusDefinition,
  StatusItem,
  StatusMapLabels,
  StatusRegistry,
  TileConfig,
  ViewConfig,
} from './core/types';
