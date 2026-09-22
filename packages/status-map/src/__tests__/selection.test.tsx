import type * as L from 'leaflet';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StatusMap } from '../StatusMap';
import type { StatusItem, StatusRegistry, TileConfig, ViewConfig } from '../core/types';
import { giveMapASize } from './helpers/mapSize';
import { ResizeObserverMock } from './helpers/resizeObserver';

const tiles: TileConfig = { url: 'https://tiles.invalid/{z}/{x}/{y}.png', attribution: 'test' };
const view: ViewConfig = { defaultCenter: [46.6, 2.4], defaultZoom: 6 };
const noCluster = { enabled: false } as const;

const statuses: StatusRegistry = {
  ok: { color: '#1ED760', severity: 0, label: 'en service' },
  offline: { color: '#FF4E5E', severity: 2, label: 'hors ligne' },
};

const items: StatusItem[] = [
  { id: 'a', status: 'ok', lat: 46.6, lng: 2.4 },
  { id: 'b', status: 'offline', lat: 46.61, lng: 2.41 },
  { id: 'loin', status: 'ok', lat: 12, lng: 100 },
];

function renderMap(selectedId: string | null, cluster: object = noCluster) {
  let map: L.Map | undefined;
  const utils = render(
    <StatusMap
      items={items}
      statuses={statuses}
      tiles={tiles}
      view={view}
      cluster={cluster}
      selectedId={selectedId}
      onReady={(instance) => {
        map = instance;
      }}
    />,
  );

  if (!map) throw new Error('la carte devrait être initialisée au montage');
  giveMapASize(map);
  return { ...utils, map };
}

function selected(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.sm-marker--selected'));
}

afterEach(() => {
  cleanup();
  ResizeObserverMock.reset();
});

describe('sélection pilotée', () => {
  it('ne met rien en valeur sans sélection', () => {
    const { container } = renderMap(null);
    expect(selected(container)).toHaveLength(0);
  });

  it('met en valeur le seul marqueur sélectionné', () => {
    const { container } = renderMap('b');
    const marked = selected(container);

    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveAttribute('aria-label', 'b - hors ligne');
  });

  it('déplace la mise en valeur sans toucher aux autres marqueurs', () => {
    const { container, rerender } = renderMap('a');
    expect(selected(container)[0]).toHaveAttribute('aria-label', 'a - en service');

    rerender(
      <StatusMap
        items={items}
        statuses={statuses}
        tiles={tiles}
        view={view}
        cluster={noCluster}
        selectedId="b"
      />,
    );

    const marked = selected(container);
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveAttribute('aria-label', 'b - hors ligne');
  });

  it('ne déplace pas la carte pour un marqueur déjà à l écran', () => {
    const { map, rerender } = renderMap(null);
    const panTo = vi.spyOn(map, 'panTo');

    rerender(
      <StatusMap
        items={items}
        statuses={statuses}
        tiles={tiles}
        view={view}
        cluster={noCluster}
        selectedId="a"
      />,
    );

    expect(panTo).not.toHaveBeenCalled();
  });

  it('ramène à l écran un marqueur hors cadre', () => {
    const { map, rerender } = renderMap(null);
    const panTo = vi.spyOn(map, 'panTo').mockImplementation(() => map);

    rerender(
      <StatusMap
        items={items}
        statuses={statuses}
        tiles={tiles}
        view={view}
        cluster={noCluster}
        selectedId="loin"
      />,
    );

    expect(panTo).toHaveBeenCalledTimes(1);
    const [position] = panTo.mock.calls[0] ?? [];
    expect(position).toMatchObject({ lat: 12, lng: 100 });
  });

  it('déplie le regroupement qui cache le marqueur sélectionné', () => {
    const { map, rerender } = renderMap(null, { maxRadius: 200 });

    const groups: L.MarkerClusterGroup[] = [];
    map.eachLayer((layer) => {
      if ('refreshClusters' in layer) groups.push(layer as L.MarkerClusterGroup);
    });
    const [group] = groups;
    if (!group) throw new Error('le groupe de regroupement devrait exister');

    const zoomToShow = vi.spyOn(group, 'zoomToShowLayer').mockImplementation(() => undefined);

    rerender(
      <StatusMap
        items={items}
        statuses={statuses}
        tiles={tiles}
        view={view}
        cluster={{ maxRadius: 200 }}
        selectedId="a"
      />,
    );

    expect(zoomToShow).toHaveBeenCalledTimes(1);
  });
});
