import { create } from 'zustand';

export type ViewMode = '2d' | '3d';

const STORAGE_KEY = 'galerie:vue';

/*
 * La vue choisie survit au rechargement, mais pas au refus de la machine : si
 * le palier calculé au montage vaut `2d`, la scène ne démarre pas, quelle que
 * soit la préférence enregistrée. Le stockage garde un souhait, pas un ordre.
 *
 * L'accès est protégé : en navigation privée, certains navigateurs lèvent au
 * lieu de rendre `null`, et une préférence d'affichage ne vaut pas une page
 * blanche.
 */
function storedView(): ViewMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === '2d' || saved === '3d') return saved;
  } catch {
    // Stockage refusé : on garde la valeur par défaut.
  }
  return '3d';
}

function remember(view: ViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, view);
  } catch {
    // Sans mémoire, la bascule reste valable pour la visite en cours.
  }
}

interface GalleryState {
  /** Techno mise en avant, ou rien. Filtre la grille et éteint le reste du graphe. */
  techFilter: string | null;
  toggleTech: (id: string) => void;
  clearTech: () => void;

  /** Ce que le visiteur a demandé. Le palier peut encore l'en empêcher. */
  view: ViewMode;
  setView: (view: ViewMode) => void;
  /**
   * Repli forcé, sans effacer le souhait du visiteur : perte de contexte
   * WebGL, ou machine qui ne peut pas tenir la scène.
   */
  demoted: boolean;
  demote: () => void;
}

export const useGallery = create<GalleryState>((set) => ({
  techFilter: null,
  toggleTech: (id) => {
    set((state) => ({ techFilter: state.techFilter === id ? null : id }));
  },
  clearTech: () => {
    set({ techFilter: null });
  },

  view: storedView(),
  setView: (view) => {
    remember(view);
    // Rebasculer en 3D à la main est une seconde chance : on lève le repli.
    set({ view, demoted: false });
  },
  demoted: false,
  demote: () => {
    set({ demoted: true });
  },
}));
