import type { CSSProperties } from 'react';
import type { StatusMapLabels } from './core/types';
import { useStatusMap, type UseStatusMapOptions } from './useStatusMap';

export interface StatusMapProps<K extends string = string, D = unknown> extends UseStatusMapOptions<
  K,
  D
> {
  className?: string;
  style?: CSSProperties;
  labels?: StatusMapLabels;
}

export function StatusMap<K extends string = string, D = unknown>({
  className,
  style,
  labels,
  ...options
}: StatusMapProps<K, D>) {
  const { containerRef } = useStatusMap(options);

  return (
    <div
      ref={containerRef}
      className={className ? `sm-map ${className}` : 'sm-map'}
      style={style}
      role={labels?.map ? 'region' : undefined}
      aria-label={labels?.map}
    />
  );
}
