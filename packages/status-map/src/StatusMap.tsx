import type { CSSProperties } from 'react';
import type { AnyStatusItem, StatusItem } from './core/types';
import { useStatusMap, type UseStatusMapOptions } from './useStatusMap';

export interface StatusMapProps<
  T extends AnyStatusItem = StatusItem,
> extends UseStatusMapOptions<T> {
  className?: string;
  style?: CSSProperties;
}

export function StatusMap<T extends AnyStatusItem = StatusItem>({
  className,
  style,
  ...options
}: StatusMapProps<T>) {
  const { containerRef, sprite, popup } = useStatusMap(options);
  const label = options.labels?.map;

  return (
    <div className={className ? `sm-map ${className}` : 'sm-map'} style={style}>
      {sprite}
      {popup}
      <div
        ref={containerRef}
        className="sm-map__canvas"
        role={label ? 'region' : undefined}
        aria-label={label}
      />
    </div>
  );
}
