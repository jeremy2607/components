export { StatusMap, type StatusMapProps } from './StatusMap';
export { useStatusMap, type UseStatusMapOptions, type UseStatusMapResult } from './useStatusMap';

export { analyzeDataQuality } from './core/dataQuality';
export { computeView, isLocated, type ViewResolution } from './core/view';

export type {
  DataQualityReport,
  LatLngTuple,
  LocatedItem,
  PointTuple,
  StatusItem,
  StatusMapLabels,
  TileConfig,
  ViewConfig,
} from './core/types';
