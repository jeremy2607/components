import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGallery } from './useGallery';

const initial = useGallery.getState();

beforeEach(() => {
  useGallery.setState({ techFilter: null, view: '3d', demoted: false });
  localStorage.clear();
});

describe('le filtre de techno', () => {
  it('bascule et se relâche sur la même techno', () => {
    initial.toggleTech('react');
    expect(useGallery.getState().techFilter).toBe('react');

    initial.toggleTech('react');
    expect(useGallery.getState().techFilter).toBeNull();
  });

  it('remplace la techno mise en avant', () => {
    initial.toggleTech('react');
    initial.toggleTech('leaflet');
    expect(useGallery.getState().techFilter).toBe('leaflet');
  });

  it('se vide', () => {
    initial.toggleTech('react');
    initial.clearTech();
    expect(useGallery.getState().techFilter).toBeNull();
  });
});

describe('la vue', () => {
  it('retient le choix du visiteur', () => {
    initial.setView('2d');
    expect(useGallery.getState().view).toBe('2d');
    expect(localStorage.getItem('galerie:vue')).toBe('2d');
  });

  it('marque le repli sans effacer le souhait', () => {
    initial.demote();
    expect(useGallery.getState().demoted).toBe(true);
    expect(useGallery.getState().view).toBe('3d');
  });

  it('lève le repli quand le visiteur redemande la 3D', () => {
    initial.demote();
    initial.setView('3d');
    expect(useGallery.getState().demoted).toBe(false);
  });

  it('survit à un stockage qui refuse d’écrire', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('navigation privée');
    });

    expect(() => {
      initial.setView('2d');
    }).not.toThrow();
    expect(useGallery.getState().view).toBe('2d');

    setItem.mockRestore();
  });
});
