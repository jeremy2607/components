import * as L from 'leaflet';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type {
  AnyStatusItem,
  PopupConfig,
  PopupContext,
  StatusLookup,
  StatusRegistry,
} from '../core/types';
import { useLatest } from './useLatest';

const DEFAULT_CLOSE_DELAY = 200;
const DEFAULT_MAX_WIDTH = 320;
/** Vide laissé entre le haut de la pastille et la pointe de la bulle. */
const MARKER_GAP = 8;

export interface UsePopupOptions<T extends AnyStatusItem> {
  mapRef: { readonly current: L.Map | null };
  map: L.Map | null;
  /** Source de vérité du contenu : la bulle relit l'élément, elle ne le fige pas. */
  items: readonly T[];
  statuses: StatusRegistry<T['status']>;
  render: ((item: T, context: PopupContext<T['status']>) => ReactNode) | undefined;
  config: PopupConfig | undefined;
  markerSize: number;
  locale: string | undefined;
}

export interface UsePopupResult<T extends AnyStatusItem> {
  /** Portail React. À rendre une fois, à côté du conteneur de carte. */
  node: ReactNode;
  open: (item: T, position: L.LatLng) => void;
  /** Programme la fermeture, sauf si le curseur vient d'entrer dans la bulle. */
  scheduleClose: (relatedTarget: EventTarget | null) => void;
  cancelClose: () => void;
  close: () => void;
}

/** Rejoue l'animation d'entrée sur un élément que Leaflet réutilise d'une ouverture à l'autre. */
function restartEnterAnimation(element: HTMLElement | null | undefined): void {
  if (!element) return;
  element.classList.remove('sm-popup--open');
  void element.offsetWidth;
  element.classList.add('sm-popup--open');
}

/**
 * Bulle au survol, montée par portail.
 *
 * Une seule instance de popup sert toute la carte : trois cents marqueurs ne
 * justifient pas trois cents `bindPopup`. Le contenu est du vrai JSX rendu dans
 * un conteneur que nous possédons, jamais une chaîne HTML : les gestionnaires
 * d'événements, les liens de routeur et le contexte React continuent d'y vivre.
 */
export function usePopup<T extends AnyStatusItem>(options: UsePopupOptions<T>): UsePopupResult<T> {
  const { map, mapRef, markerSize, locale, statuses, render, items } = options;

  const [target, setTarget] = useState<{ id: string; position: L.LatLng } | null>(null);
  const [container] = useState(() => {
    const node = document.createElement('div');
    node.className = 'sm-popup__content';
    return node;
  });

  const popupRef = useRef<L.Popup | null>(null);
  const closeTimer = useRef<number | null>(null);

  const configRef = useLatest(options.config);

  const cancelClose = useCallback(() => {
    if (closeTimer.current === null) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  /*
   * Ne touche aucune ref : cette fonction est remise à `renderPopup` pendant le
   * rendu, et lire une ref là serait une faute. Un minuteur encore en vol ne
   * fera que redemander une fermeture déjà obtenue.
   */
  const close = useCallback(() => {
    setTarget(null);
  }, []);

  const scheduleClose = useCallback(
    (relatedTarget: EventTarget | null) => {
      cancelClose();

      /*
       * Le curseur est déjà passé dans la bulle : rien à programmer. Sinon il
       * traverse le vide, et la bulle a le temps de le rattraper par son propre
       * écouteur avant l'échéance.
       */
      const element = popupRef.current?.getElement();
      if (relatedTarget instanceof Node && element?.contains(relatedTarget)) return;

      closeTimer.current = window.setTimeout(() => {
        closeTimer.current = null;
        setTarget(null);
      }, configRef.current?.closeDelay ?? DEFAULT_CLOSE_DELAY);
    },
    [cancelClose, configRef],
  );

  const open = useCallback(
    (item: T, position: L.LatLng) => {
      cancelClose();
      setTarget({ id: item.id, position });
    },
    [cancelClose],
  );

  const offsetKey = JSON.stringify(options.config?.offset ?? null);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;

    const config = configRef.current;
    const popup = L.popup({
      autoPan: false,
      closeButton: false,
      closeOnClick: false,
      autoClose: false,
      keepInView: false,
      maxWidth: config?.maxWidth ?? DEFAULT_MAX_WIDTH,
      // Le décalage découle de la géométrie du marqueur, jamais d'un nombre en dur.
      offset: config?.offset
        ? [config.offset[0], config.offset[1]]
        : [0, -(markerSize / 2) - MARKER_GAP],
      className: config?.className ? `sm-popup ${config.className}` : 'sm-popup',
    });
    popupRef.current = popup;

    return () => {
      popupRef.current = null;
      instance.closePopup(popup);
      popup.remove();
    };
  }, [map, mapRef, markerSize, offsetKey, configRef]);

  // Le curseur doit pouvoir séjourner dans la bulle sans la faire disparaître.
  useEffect(() => {
    const popup = popupRef.current;
    if (!popup) return;

    const leave = (event: MouseEvent) => {
      scheduleClose(event.relatedTarget);
    };

    let attached: HTMLElement | null = null;
    const attach = () => {
      const element = popup.getElement();
      if (!element || element === attached) return;

      attached?.removeEventListener('mouseover', cancelClose);
      attached?.removeEventListener('mouseleave', leave);
      element.addEventListener('mouseover', cancelClose);
      element.addEventListener('mouseleave', leave);
      attached = element;
    };

    popup.on('add', attach);

    return () => {
      popup.off('add', attach);
      attached?.removeEventListener('mouseover', cancelClose);
      attached?.removeEventListener('mouseleave', leave);
    };
  }, [map, cancelClose, scheduleClose]);

  useEffect(() => cancelClose, [cancelClose]);

  /*
   * Effet de mise en page : le contenu du portail est déjà dans le conteneur
   * quand il s'exécute, donc Leaflet mesure une bulle pleine et la place juste.
   */
  /*
   * L'élément est relu à chaque rendu : un statut qui bascule sous le curseur
   * doit changer la bulle, et un élément qui disparaît d'`items` doit la fermer.
   */
  const item = target ? items.find((candidate) => candidate.id === target.id) : undefined;

  useLayoutEffect(() => {
    const instance = mapRef.current;
    const popup = popupRef.current;
    if (!instance || !popup) return;

    if (!target || !item) {
      instance.closePopup(popup);
      return;
    }

    popup.setLatLng(target.position);
    if (popup.getContent() !== container) popup.setContent(container);
    if (!instance.hasLayer(popup)) instance.openPopup(popup);
    popup.update();
    restartEnterAnimation(popup.getElement());
  }, [target, item, container, mapRef]);

  const statusKey = item?.status;
  const lookup: StatusLookup = statuses;
  const definition = statusKey ? lookup[statusKey] : undefined;

  const node =
    item && definition && statusKey && render
      ? createPortal(render(item, { status: definition, statusKey, close, locale }), container)
      : null;

  return { node, open, scheduleClose, cancelClose, close };
}
