export { BeforeAfter, type BeforeAfterLabels, type BeforeAfterProps } from './BeforeAfter';
export { useComparison, type ComparisonState, type UseComparisonOptions } from './useComparison';
export { useFrameCheck } from './useFrameCheck';
export {
  clampPosition,
  DEFAULT_POSITION,
  MAX_POSITION,
  MIN_POSITION,
  parsePosition,
} from './core/position';
export { compareFrames, DEFAULT_TOLERANCE, driftBetween, ratioOf } from './core/ratio';
export type { Dimensions, MismatchReport } from './core/types';
