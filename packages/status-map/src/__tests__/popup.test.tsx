import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StatusMap } from '../StatusMap';
import type { StatusItem, StatusRegistry, TileConfig, ViewConfig } from '../core/types';
import { ResizeObserverMock } from './helpers/resizeObserver';

const tiles: TileConfig = { url: 'https://tiles.invalid/{z}/{x}/{y}.png', attribution: 'test' };
const view: ViewConfig = { defaultCenter: [46.6, 2.4] };
const noCluster = { enabled: false } as const;

const statuses: StatusRegistry = {
  ok: { color: '#1ED760', severity: 0, label: 'en service' },
  offline: { color: '#FF4E5E', severity: 2, label: 'hors ligne' },
};

const items: StatusItem[] = [
  { id: 'a', status: 'ok', lat: 43.7, lng: 7.26 },
  { id: 'b', status: 'offline', lat: 48.85, lng: 2.35 },
];

function renderMap(props: { onSelect?: (item: StatusItem) => void } = {}) {
  const onOpenDetails = vi.fn();

  const utils = render(
    <StatusMap
      items={items}
      statuses={statuses}
      tiles={tiles}
      view={view}
      cluster={noCluster}
      onSelect={props.onSelect}
      renderPopup={(item, context) => (
        <div>
          <h2>{item.id}</h2>
          <p>{context.status.label}</p>
          <button
            type="button"
            onClick={() => {
              onOpenDetails(item.id);
            }}
          >
            Voir la fiche
          </button>
        </div>
      )}
    />,
  );

  return { ...utils, onOpenDetails };
}

function markerAt(container: HTMLElement, index: number): HTMLElement {
  const marker = container.querySelectorAll<HTMLElement>('.sm-marker')[index];
  if (!marker) throw new Error(`aucun marqueur à l'index ${index}`);
  return marker;
}

function popupElement(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>('.sm-popup');
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  ResizeObserverMock.reset();
});

describe('bulle au survol', () => {
  it("n'affiche rien avant le survol", () => {
    const { container } = renderMap();
    expect(popupElement(container)).toBeNull();
  });

  it('ouvre la bulle au survol du marqueur, avec le contenu rendu par React', () => {
    const { container } = renderMap();
    fireEvent.mouseOver(markerAt(container, 0));

    expect(popupElement(container)).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'a' })).toBeInTheDocument();
    expect(screen.getByText('en service')).toBeInTheDocument();
  });

  it('monte du vrai JSX : le gestionnaire du bouton est appelé', () => {
    const { container, onOpenDetails } = renderMap();
    fireEvent.mouseOver(markerAt(container, 0));

    fireEvent.click(screen.getByRole('button', { name: 'Voir la fiche' }));
    expect(onOpenDetails).toHaveBeenCalledWith('a');
  });

  it('masque le bouton de fermeture natif et ne déplace pas la carte', () => {
    const { container } = renderMap();
    fireEvent.mouseOver(markerAt(container, 0));

    expect(container.querySelector('.leaflet-popup-close-button')).toBeNull();
    expect(popupElement(container)).toHaveClass('sm-popup');
  });

  it('laisse le curseur traverser le vide : la bulle survit au délai si elle est survolée', () => {
    const { container } = renderMap();
    const marker = markerAt(container, 0);
    fireEvent.mouseOver(marker);

    // Le curseur quitte le marqueur par le vide, la carte est sous lui.
    fireEvent.mouseOut(marker, { relatedTarget: container });
    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(popupElement(container)).not.toBeNull();

    // Il atteint la bulle avant l'échéance : la fermeture est annulée.
    const popup = popupElement(container);
    if (!popup) throw new Error('la bulle devrait être ouverte');
    fireEvent.mouseOver(popup);
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(popupElement(container)).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'a' })).toBeInTheDocument();
  });

  it('ne programme aucune fermeture si le curseur entre directement dans la bulle', () => {
    const { container } = renderMap();
    const marker = markerAt(container, 0);
    fireEvent.mouseOver(marker);

    const popup = popupElement(container);
    if (!popup) throw new Error('la bulle devrait être ouverte');
    fireEvent.mouseOut(marker, { relatedTarget: popup });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.getByRole('heading', { name: 'a' })).toBeInTheDocument();
  });

  it('ferme après le délai quand le curseur part ailleurs', () => {
    const { container } = renderMap();
    const marker = markerAt(container, 0);
    fireEvent.mouseOver(marker);
    expect(screen.getByRole('heading', { name: 'a' })).toBeInTheDocument();

    fireEvent.mouseOut(marker, { relatedTarget: container });
    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(screen.queryByRole('heading', { name: 'a' })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(screen.queryByRole('heading', { name: 'a' })).not.toBeInTheDocument();
  });

  it('ferme après le délai quand le curseur quitte la bulle', () => {
    const { container } = renderMap();
    fireEvent.mouseOver(markerAt(container, 0));

    const popup = popupElement(container);
    if (!popup) throw new Error('la bulle devrait être ouverte');
    fireEvent.mouseLeave(popup, { relatedTarget: container });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.queryByRole('heading', { name: 'a' })).not.toBeInTheDocument();
  });

  it('passe d un marqueur à l autre sans clignoter', () => {
    const { container } = renderMap();
    const first = markerAt(container, 0);

    fireEvent.mouseOver(first);
    fireEvent.mouseOut(first, { relatedTarget: container });
    fireEvent.mouseOver(markerAt(container, 1));
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.getByRole('heading', { name: 'b' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'a' })).not.toBeInTheDocument();
  });

  it('remonte le clic sur un marqueur sans naviguer', () => {
    const onSelect = vi.fn();
    const { container } = renderMap({ onSelect });

    fireEvent.click(markerAt(container, 1));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0]).toMatchObject({ id: 'b', status: 'offline' });
  });

  it('suit le statut qui bascule sous le curseur', () => {
    const { container, rerender } = renderMap();
    fireEvent.mouseOver(markerAt(container, 0));
    expect(screen.getByText('en service')).toBeInTheDocument();

    rerender(
      <StatusMap
        items={[{ id: 'a', status: 'offline', lat: 43.7, lng: 7.26 }, items[1] as StatusItem]}
        statuses={statuses}
        tiles={tiles}
        view={view}
        cluster={noCluster}
        renderPopup={(item, context) => (
          <div>
            <h2>{item.id}</h2>
            <p>{context.status.label}</p>
          </div>
        )}
      />,
    );

    expect(screen.getByText('hors ligne')).toBeInTheDocument();
    expect(screen.queryByText('en service')).not.toBeInTheDocument();
  });

  it("ferme la bulle quand l'élément survolé disparaît de la liste", () => {
    const { container, rerender } = renderMap();
    fireEvent.mouseOver(markerAt(container, 0));
    expect(screen.getByRole('heading', { name: 'a' })).toBeInTheDocument();

    rerender(
      <StatusMap
        items={[items[1] as StatusItem]}
        statuses={statuses}
        tiles={tiles}
        view={view}
        cluster={noCluster}
        renderPopup={(item) => <h2>{item.id}</h2>}
      />,
    );

    expect(screen.queryByRole('heading', { name: 'a' })).not.toBeInTheDocument();
  });

  it('ne laisse ni bulle ni minuteur en vol après démontage', () => {
    const { container, unmount } = renderMap();
    const marker = markerAt(container, 0);
    fireEvent.mouseOver(marker);
    fireEvent.mouseOut(marker, { relatedTarget: container });

    unmount();
    cleanup();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(document.body.childElementCount).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
