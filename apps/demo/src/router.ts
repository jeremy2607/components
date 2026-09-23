import { useSyncExternalStore } from 'react';

export type Route = { name: 'home' } | { name: 'component'; id: string } | { name: 'inconnue' };

const listeners = new Set<() => void>();
let snapshot = current();

function current(): string {
  return window.location.pathname + window.location.search;
}

function emit(): void {
  snapshot = current();
  for (const listener of listeners) listener();
}

window.addEventListener('popstate', emit);

/**
 * Routeur maison : deux motifs, aucune route imbriquée, aucun chargeur de
 * données. Quinze kilo-octets de bibliothèque pour ça ne se justifiaient pas.
 * Le jour où il faut plus, la migration est mécanique.
 */
export function navigate(href: string, options: { replace?: boolean } = {}): void {
  if (href === current()) return;

  if (options.replace) window.history.replaceState(null, '', href);
  else window.history.pushState(null, '', href);

  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): string {
  return snapshot;
}

export function useLocation(): string {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** `/components/status-map/` et `/components/status-map` mènent au même endroit. */
export function parseRoute(location: string): Route {
  const path = location.split('?')[0] ?? '/';
  if (path === '/' || path === '') return { name: 'home' };

  const match = /^\/components\/([a-z0-9-]+)\/?$/.exec(path);
  if (match?.[1]) return { name: 'component', id: match[1] };

  return { name: 'inconnue' };
}

export function useRoute(): Route {
  return parseRoute(useLocation());
}

/**
 * Le plein écran d'une démo est dans l'URL, pas dans un état local : il se
 * partage, et le bouton retour du navigateur en sort.
 */
export function useFullscreen(): boolean {
  return new URLSearchParams(useLocation().split('?')[1] ?? '').get('demo') === 'plein';
}

export function hrefFor(id: string): string {
  return `/components/${id}/`;
}
