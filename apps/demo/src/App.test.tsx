import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { catalog } from './catalog';
import { navigate } from './router';

/*
 * Les métadonnées de la page ont déjà été fausses une fois, sans que rien ne le
 * montre : `App` et la page d'un composant appelaient toutes deux
 * `useDocumentMeta`, et comme React exécute les effets des enfants avant ceux
 * du parent, la page posait les bonnes valeurs que `App` écrasait aussitôt par
 * celles de l'accueil. Le HTML pré-rendu restait juste, donc rien ne se voyait
 * à l'oeil ; seuls les robots qui exécutent le JavaScript lisaient le mauvais
 * titre sur chaque composant.
 *
 * Ces tests regardent le DOM après montage, c'est-à-dire exactement ce que
 * voyaient ces robots.
 */

/*
 * On passe par `navigate` et non par `history.pushState` : le routeur maison
 * tient son propre instantané et n'écoute que `popstate`, donc un `pushState`
 * direct changerait l'URL sans que rien ne se re-rende. C'est aussi ce que
 * fait un vrai clic dans la galerie.
 */
function aller(chemin: string): void {
  navigate(chemin);
}

function canonique(): string | null {
  return document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null;
}

function metaContenu(selecteur: string): string | null {
  return document.head.querySelector<HTMLMetaElement>(selecteur)?.content ?? null;
}

const premier = catalog.find((entry) => entry.status !== 'planned');
if (!premier) throw new Error('le catalogue n’a aucun composant en ligne');

beforeEach(() => {
  document.head.querySelectorAll('link[rel="canonical"], meta').forEach((node) => {
    node.remove();
  });
});

afterEach(() => {
  cleanup();
  aller('/');
});

describe('métadonnées de la page', () => {
  it('décrit l’accueil sur l’accueil', () => {
    aller('/');
    render(<App />);

    expect(document.title).toContain('bibliothèque de composants');
    expect(canonique()).toBe(`${window.location.origin}/`);
  });

  it('décrit le composant sur la page d’un composant', () => {
    aller(`/components/${premier.id}/`);
    render(<App />);

    expect(document.title).toBe(premier.seo.title);
    expect(metaContenu('meta[name="description"]')).toBe(premier.seo.description);
    expect(canonique()).toBe(`${window.location.origin}/components/${premier.id}/`);
  });

  it('accorde Open Graph au reste, sans quoi l’aperçu d’un lien ment', () => {
    aller(`/components/${premier.id}/`);
    render(<App />);

    expect(metaContenu('meta[property="og:title"]')).toBe(premier.seo.title);
    expect(metaContenu('meta[property="og:description"]')).toBe(premier.seo.description);
    expect(metaContenu('meta[property="og:url"]')).toBe(
      `${window.location.origin}/components/${premier.id}/`,
    );
  });

  it('ne laisse jamais deux URL canoniques derrière lui', () => {
    aller(`/components/${premier.id}/`);
    render(<App />);
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  });

  it('retombe sur l’accueil pour une route inconnue', () => {
    aller('/nawak');
    render(<App />);

    expect(document.title).toContain('bibliothèque de composants');
    expect(canonique()).toBe(`${window.location.origin}/`);
  });

  it('retombe sur l’accueil pour un composant à venir, qui n’a pas de page', () => {
    const avenir = catalog.find((entry) => entry.status === 'planned');
    if (!avenir) return;

    aller(`/components/${avenir.id}/`);
    render(<App />);

    expect(document.title).toContain('bibliothèque de composants');
  });
});
