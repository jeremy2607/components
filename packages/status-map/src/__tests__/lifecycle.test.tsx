import type * as L from 'leaflet';
import { StrictMode } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StatusMap } from '../StatusMap';
import type { StatusItem, TileConfig, ViewConfig } from '../core/types';
import { ResizeObserverMock } from './helpers/resizeObserver';

const tiles: TileConfig = { url: 'https://tiles.invalid/{z}/{x}/{y}.png', attribution: 'test' };
const view: ViewConfig = { defaultCenter: [46.6, 2.4] };

const items: StatusItem[] = [
  { id: 'a', lat: 43.7, lng: 7.26, status: 'ok' },
  { id: 'b', lat: 48.85, lng: 2.35, status: 'ok' },
];

function renderMap(props: Partial<React.ComponentProps<typeof StatusMap>> = {}) {
  let map: L.Map | undefined;
  const utils = render(
    <StatusMap
      items={[]}
      tiles={tiles}
      view={view}
      onReady={(instance) => {
        map = instance;
      }}
      {...props}
    />,
  );

  if (!map) throw new Error('la carte devrait être initialisée au montage');
  return { ...utils, map };
}

afterEach(() => {
  cleanup();
  ResizeObserverMock.reset();
});

describe('StatusMap', () => {
  it('monte un conteneur de carte', () => {
    const { container } = renderMap({ labels: { map: 'Carte du parc' } });
    const node = container.querySelector('.sm-map');

    expect(node).toBeInTheDocument();
    expect(node).toHaveAttribute('aria-label', 'Carte du parc');
    expect(node).toHaveClass('leaflet-container');
  });

  it('invalide la taille à chaque mesure du conteneur', () => {
    const { map } = renderMap();
    const invalidateSize = vi.spyOn(map, 'invalidateSize');

    ResizeObserverMock.resizeAll(800, 600);
    expect(invalidateSize).toHaveBeenCalledTimes(1);

    ResizeObserverMock.resizeAll(900, 700);
    expect(invalidateSize).toHaveBeenCalledTimes(2);
  });

  it('ignore une mesure de taille nulle', () => {
    const { map } = renderMap();
    const invalidateSize = vi.spyOn(map, 'invalidateSize');

    ResizeObserverMock.resizeAll(0, 0);
    expect(invalidateSize).not.toHaveBeenCalled();
  });

  it('cadre une seule fois, à la première mesure non nulle', () => {
    const { map } = renderMap({ items });
    const fitBounds = vi.spyOn(map, 'fitBounds').mockImplementation(() => map);

    ResizeObserverMock.resizeAll(0, 0);
    expect(fitBounds).not.toHaveBeenCalled();

    ResizeObserverMock.resizeAll(800, 600);
    expect(fitBounds).toHaveBeenCalledTimes(1);

    ResizeObserverMock.resizeAll(900, 700);
    expect(fitBounds).toHaveBeenCalledTimes(1);
  });

  it('ne cadre pas quand fitOnLoad est desactive', () => {
    const { map } = renderMap({ items, fitOnLoad: false });
    const fitBounds = vi.spyOn(map, 'fitBounds').mockImplementation(() => map);

    ResizeObserverMock.resizeAll(800, 600);
    expect(fitBounds).not.toHaveBeenCalled();
  });

  it('signale la gravité du manque de coordonnées', () => {
    const onDataQuality = vi.fn();
    renderMap({
      items: [items[0] as StatusItem, { id: 'c', status: 'ok' }],
      onDataQuality,
    });

    expect(onDataQuality).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning', missing: 1, missingIds: ['c'] }),
    );
  });

  it('survit au double montage de StrictMode', () => {
    expect(() =>
      render(<StatusMap items={items} tiles={tiles} view={view} />, { wrapper: StrictMode }),
    ).not.toThrow();
  });

  it('ne laisse aucun élément orphelin apres 50 montages et démontages', () => {
    for (let i = 0; i < 50; i += 1) {
      const { unmount } = render(<StatusMap items={items} tiles={tiles} view={view} />);
      unmount();
    }
    cleanup();

    expect(document.body.childElementCount).toBe(0);
    expect(document.querySelectorAll('.leaflet-container')).toHaveLength(0);
    expect(ResizeObserverMock.instances).toHaveLength(50);
    expect(ResizeObserverMock.instances.every((observer) => observer.disconnected)).toBe(true);
  });
});
