import type * as L from 'leaflet';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StatusMap } from '../StatusMap';
import type { StatusItem, StatusRegistry, TileConfig, ViewConfig } from '../core/types';
import { giveMapASize } from './helpers/mapSize';
import { ResizeObserverMock } from './helpers/resizeObserver';

const tiles: TileConfig = { url: 'https://tiles.invalid/{z}/{x}/{y}.png', attribution: 'test' };
const view: ViewConfig = { defaultCenter: [43.7, 7.26], defaultZoom: 5 };

const statuses: StatusRegistry = {
  ok: { color: '#1ED760', severity: 0, label: 'en service' },
  warning: { color: '#FFBE4E', severity: 1, label: 'en alerte' },
  offline: { color: '#FF4E5E', severity: 2, label: 'hors ligne' },
};

/** Trois points assez proches pour être regroupés au zoom par défaut. */
function nearby(id: string, status: string, offset: number): StatusItem {
  return { id, status, lat: 43.7 + offset * 0.001, lng: 7.26 + offset * 0.001 };
}

function renderMap(items: readonly StatusItem[], cluster?: Record<string, unknown>) {
  let map: L.Map | undefined;
  const utils = render(
    <StatusMap
      items={items}
      statuses={statuses}
      tiles={tiles}
      view={view}
      cluster={cluster}
      onReady={(instance) => {
        map = instance;
      }}
    />,
  );

  if (!map) throw new Error('la carte devrait être initialisée au montage');
  giveMapASize(map);
  return { ...utils, map };
}

/** Les types du greffon déclarent `options` en LayerOptions : on le resserre ici. */
type ClusterGroup = L.MarkerClusterGroup & { options: L.MarkerClusterGroupOptions };

function clusterGroupsOf(map: L.Map): ClusterGroup[] {
  const groups: ClusterGroup[] = [];
  map.eachLayer((layer) => {
    if ('refreshClusters' in layer) groups.push(layer as ClusterGroup);
  });
  return groups;
}

function clusterElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.sm-cluster'));
}

afterEach(() => {
  cleanup();
  ResizeObserverMock.reset();
});

describe('regroupement', () => {
  it('colore le groupe selon la sévérité la plus haute qu il contient', () => {
    const { container } = renderMap([
      nearby('a', 'ok', 0),
      nearby('b', 'warning', 1),
      nearby('c', 'offline', 2),
    ]);

    const [cluster] = clusterElements(container);
    expect(cluster).toHaveClass('sm-cluster--offline');
    expect(
      cluster
        ?.querySelector<HTMLElement>('.sm-cluster__body')
        ?.style.getPropertyValue('--sm-cluster-color'),
    ).toBe('#FF4E5E');
  });

  it("n'emprunte pas les classes de paliers du greffon", () => {
    const { container } = renderMap([nearby('a', 'ok', 0), nearby('b', 'ok', 1)]);

    expect(container.querySelector('.marker-cluster-small')).toBeNull();
    expect(container.querySelector('.marker-cluster-medium')).toBeNull();
    expect(container.querySelector('.marker-cluster-large')).toBeNull();
  });

  it('affiche le compte et le porte dans le nom accessible', () => {
    const { container } = renderMap([
      nearby('a', 'ok', 0),
      nearby('b', 'warning', 1),
      nearby('c', 'ok', 2),
    ]);

    const [cluster] = clusterElements(container);
    expect(cluster?.querySelector('.sm-cluster__count')?.textContent).toBe('3');
    expect(cluster).toHaveAttribute('aria-label', '3 - en alerte');
  });

  it('recolore le groupe quand un statut change', () => {
    const items = [nearby('a', 'ok', 0), nearby('b', 'ok', 1), nearby('c', 'ok', 2)];
    const { container, rerender } = renderMap(items);

    expect(clusterElements(container)[0]).toHaveClass('sm-cluster--ok');

    rerender(
      <StatusMap
        items={[nearby('a', 'ok', 0), nearby('b', 'offline', 1), nearby('c', 'ok', 2)]}
        statuses={statuses}
        tiles={tiles}
        view={view}
      />,
    );

    expect(clusterElements(container)[0]).toHaveClass('sm-cluster--offline');
  });

  it('ne rafraîchit que les groupes touchés par un changement de statut', () => {
    const items = [nearby('a', 'ok', 0), nearby('b', 'ok', 1)];
    const { map, rerender } = renderMap(items);

    const [clusterGroup] = clusterGroupsOf(map);
    if (!clusterGroup) throw new Error('le groupe de regroupement devrait exister');

    const refresh = vi.spyOn(clusterGroup, 'refreshClusters');

    rerender(
      <StatusMap
        items={[nearby('a', 'ok', 0), nearby('b', 'offline', 1)]}
        statuses={statuses}
        tiles={tiles}
        view={view}
      />,
    );

    expect(refresh).toHaveBeenCalledTimes(1);
    const [argument] = refresh.mock.calls[0] ?? [];
    expect(Array.isArray(argument)).toBe(true);
    expect((argument as L.Marker[]).length).toBe(1);
  });

  it('regroupe même quand le fond de carte ne déclare pas de zoom maximum', () => {
    const { map } = renderMap([nearby('a', 'ok', 0), nearby('b', 'ok', 1)]);

    // Passer maxZoom: undefined écraserait le défaut de L.TileLayer, et le
    // greffon refuserait de démarrer sur un zoom maximum infini.
    expect(map.getMaxZoom()).toBeLessThan(Number.POSITIVE_INFINITY);
    expect(clusterGroupsOf(map)).toHaveLength(1);
  });

  it('laisse chaque marqueur seul quand le regroupement est désactivé', () => {
    const { container } = renderMap(
      [nearby('a', 'ok', 0), nearby('b', 'warning', 1), nearby('c', 'offline', 2)],
      { enabled: false },
    );

    expect(clusterElements(container)).toHaveLength(0);
    expect(container.querySelectorAll('.sm-marker')).toHaveLength(3);
  });

  it('transmet les options du greffon sous leur orthographe exacte', () => {
    const { map } = renderMap([nearby('a', 'ok', 0), nearby('b', 'ok', 1)], {
      maxRadius: 42,
      zoomToBoundsOnClick: false,
      spiderLegPolylineOptions: { weight: 4 },
    });

    const options = clusterGroupsOf(map)[0]?.options;

    expect(options?.maxClusterRadius).toBe(42);
    expect(options?.zoomToBoundsOnClick).toBe(false);
    expect(options?.spiderfyDistanceMultiplier).toBe(3);
    expect(options?.showCoverageOnHover).toBe(false);
    expect(options?.spiderLegPolylineOptions).toEqual({ weight: 4 });
  });
});
