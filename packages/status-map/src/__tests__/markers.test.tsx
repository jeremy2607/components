import type * as L from 'leaflet';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StatusMap } from '../StatusMap';
import type { StatusItem, StatusRegistry, TileConfig, ViewConfig } from '../core/types';
import { ResizeObserverMock } from './helpers/resizeObserver';

const tiles: TileConfig = { url: 'https://tiles.invalid/{z}/{x}/{y}.png', attribution: 'test' };
const view: ViewConfig = { defaultCenter: [46.6, 2.4] };

const statuses: StatusRegistry = {
  ok: {
    color: '#1ED760',
    severity: 0,
    label: 'en service',
    icon: <circle cx="12" cy="12" r="6" />,
  },
  warning: {
    color: '#FFBE4E',
    severity: 1,
    label: 'en alerte',
    icon: <rect width="8" height="8" />,
  },
  offline: { color: '#FF4E5E', severity: 2, label: 'hors ligne' },
};

function item(id: string, status: string, lat?: number, lng?: number): StatusItem {
  return { id, status, lat, lng };
}

/** Ces tests portent sur le marqueur seul : le regroupement a sa propre suite. */
const withoutCluster = { enabled: false } as const;

function renderMap(items: readonly StatusItem[], extra: { markerSize?: number } = {}) {
  let map: L.Map | undefined;
  const utils = render(
    <StatusMap
      items={items}
      statuses={statuses}
      tiles={tiles}
      view={view}
      cluster={withoutCluster}
      marker={extra.markerSize ? { size: extra.markerSize } : undefined}
      onReady={(instance) => {
        map = instance;
      }}
    />,
  );

  if (!map) throw new Error('la carte devrait être initialisée au montage');
  return { ...utils, map };
}

function markerElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.sm-marker'));
}

function markersOf(map: L.Map): L.Marker[] {
  const found: L.Marker[] = [];
  map.eachLayer((layer) => {
    if ('getLatLng' in layer && 'options' in layer) found.push(layer as L.Marker);
  });
  return found;
}

afterEach(() => {
  cleanup();
  ResizeObserverMock.reset();
});

describe('marqueurs', () => {
  it('rend un marqueur par élément géolocalisé, et ignore les autres', () => {
    const { container } = renderMap([
      item('a', 'ok', 43.7, 7.26),
      item('b', 'warning', 48.85, 2.35),
      item('c', 'ok'),
    ]);

    expect(markerElements(container)).toHaveLength(2);
  });

  it('ignore un statut absent du registre plutôt que de planter', () => {
    const { container } = renderMap([
      item('a', 'ok', 43.7, 7.26),
      item('b', 'inconnu', 48.85, 2.35),
    ]);

    expect(markerElements(container)).toHaveLength(1);
  });

  it('porte le statut sur le marqueur, pas dans le DOM', () => {
    const { map } = renderMap([item('a', 'warning', 43.7, 7.26)]);
    const [marker] = markersOf(map);

    expect(marker?.options.status).toBe('warning');
  });

  it('rend une seule définition de symbole par statut pourvu d une icône', () => {
    const { container } = renderMap([
      item('a', 'ok', 43.7, 7.26),
      item('b', 'ok', 44.7, 5.26),
      item('c', 'ok', 45.7, 4.26),
      item('d', 'warning', 48.85, 2.35),
      item('e', 'offline', 50.6, 3.05),
    ]);

    expect(container.querySelectorAll('.sm-sprite symbol')).toHaveLength(2);
    expect(markerElements(container)).toHaveLength(5);
  });

  it('instancie le glyphe depuis le sprite et applique la couleur du statut', () => {
    const { container } = renderMap([item('a', 'ok', 43.7, 7.26)]);
    const [marker] = markerElements(container);
    const symbol = container.querySelector('.sm-sprite symbol');
    const badge = marker?.querySelector<HTMLElement>('.sm-marker__badge');

    expect(marker).toHaveClass('sm-marker--ok');
    expect(badge?.style.getPropertyValue('--sm-marker-color')).toBe('#1ED760');
    expect(marker?.querySelector('use')?.getAttribute('href')).toBe(`#${symbol?.id ?? ''}`);
  });

  it('omet le glyphe pour un statut sans icône', () => {
    const { container } = renderMap([item('a', 'offline', 43.7, 7.26)]);

    expect(markerElements(container)[0]?.querySelector('use')).toBeNull();
  });

  it('centre l ancre et place le popup au-dessus de la pastille', () => {
    const { map } = renderMap([item('a', 'ok', 43.7, 7.26)], { markerSize: 40 });
    const options = markersOf(map)[0]?.options.icon?.options;

    expect(options?.iconSize).toEqual([40, 40]);
    expect(options?.iconAnchor).toEqual([20, 20]);
    expect(options?.popupAnchor).toEqual([0, -20]);
  });

  it('porte le statut en toutes lettres dans le nom accessible', () => {
    const { container } = renderMap([item('a', 'warning', 43.7, 7.26)]);
    const [marker] = markerElements(container);

    expect(marker).toHaveAttribute('aria-label', 'a - en alerte');
    // Rôle et tabindex viennent de Leaflet, qui rend le marqueur navigable.
    expect(marker).toHaveAttribute('role', 'button');
    expect(marker).toHaveAttribute('tabindex', '0');
  });

  it('remplace l icône sans recréer le marqueur quand le statut change', () => {
    const { container, map, rerender } = renderMap([item('a', 'ok', 43.7, 7.26)]);
    const before = markersOf(map)[0];

    rerender(
      <StatusMap
        items={[item('a', 'offline', 43.7, 7.26)]}
        statuses={statuses}
        tiles={tiles}
        view={view}
        cluster={withoutCluster}
      />,
    );

    const after = markersOf(map)[0];
    expect(after).toBe(before);
    expect(after?.options.status).toBe('offline');
    expect(markerElements(container)[0]).toHaveClass('sm-marker--offline');
  });

  it('déplace un marqueur existant plutôt que d en créer un autre', () => {
    const { map, rerender } = renderMap([item('a', 'ok', 43.7, 7.26)]);
    const before = markersOf(map)[0];

    rerender(
      <StatusMap
        items={[item('a', 'ok', 45.76, 4.83)]}
        statuses={statuses}
        tiles={tiles}
        view={view}
        cluster={withoutCluster}
      />,
    );

    expect(markersOf(map)[0]).toBe(before);
    expect(before?.getLatLng().lat).toBeCloseTo(45.76, 5);
  });

  it('retire le marqueur d un élément disparu', () => {
    const { container, rerender } = renderMap([
      item('a', 'ok', 43.7, 7.26),
      item('b', 'ok', 48.85, 2.35),
    ]);
    expect(markerElements(container)).toHaveLength(2);

    rerender(
      <StatusMap
        items={[item('a', 'ok', 43.7, 7.26)]}
        statuses={statuses}
        tiles={tiles}
        view={view}
        cluster={withoutCluster}
      />,
    );

    expect(markerElements(container)).toHaveLength(1);
  });
});
