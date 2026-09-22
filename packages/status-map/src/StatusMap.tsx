import type { CSSProperties } from 'react';
import { useStatusMap, type UseStatusMapOptions } from './useStatusMap';

export interface StatusMapProps<K extends string = string, D = unknown> extends UseStatusMapOptions<
  K,
  D
> {
  className?: string;
  style?: CSSProperties;
}

export function StatusMap<K extends string = string, D = unknown>({
  className,
  style,
  ...options
}: StatusMapProps<K, D>) {
  const { containerRef, sprite } = useStatusMap(options);
  const label = options.labels?.map;

  return (
    <div className={className ? `sm-map ${className}` : 'sm-map'} style={style}>
      {sprite}
      <div
        ref={containerRef}
        className="sm-map__canvas"
        role={label ? 'region' : undefined}
        aria-label={label}
      />
    </div>
  );
}
