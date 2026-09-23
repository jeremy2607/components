import { create } from 'zustand';

interface GalleryState {
  /** Techno mise en avant, ou rien. Filtre la grille, et plus tard le graphe. */
  techFilter: string | null;
  toggleTech: (id: string) => void;
  clearTech: () => void;
}

export const useGallery = create<GalleryState>((set) => ({
  techFilter: null,
  toggleTech: (id) => {
    set((state) => ({ techFilter: state.techFilter === id ? null : id }));
  },
  clearTech: () => {
    set({ techFilter: null });
  },
}));
