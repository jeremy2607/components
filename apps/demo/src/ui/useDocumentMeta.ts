import { useEffect } from 'react';

function tag(attribute: 'name' | 'property', key: string, content: string): void {
  const selector = `meta[${attribute}="${key}"]`;
  let node = document.head.querySelector<HTMLMetaElement>(selector);

  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, key);
    document.head.append(node);
  }

  node.setAttribute('content', content);
}

/**
 * Titre et métadonnées de la page courante.
 *
 * Les robots qui exécutent le JavaScript lisent ceci ; ceux qui ne
 * l'exécutent pas lisent le HTML pré-rendu, qui porte déjà les mêmes valeurs.
 */
export function useDocumentMeta(title: string, description: string, path: string): void {
  useEffect(() => {
    const url = window.location.origin + path;

    document.title = title;
    tag('name', 'description', description);
    tag('property', 'og:title', title);
    tag('property', 'og:description', description);
    tag('property', 'og:url', url);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    canonical.href = url;
  }, [title, description, path]);
}
