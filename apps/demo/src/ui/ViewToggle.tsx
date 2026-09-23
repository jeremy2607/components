import { useTier } from '../scene/useTier';
import { useGallery } from '../store/useGallery';

/**
 * La bascule 2D/3D.
 *
 * Elle ne s'affiche que là où elle a un sens : sans WebGL, ou quand le visiteur
 * demande moins de mouvement, le palier vaut `2d` et proposer une 3D qui ne
 * démarrera pas serait une promesse en l'air. Après un repli forcé, le bouton
 * revient — l'offre d'une seconde tentative, jamais un retour automatique.
 */
export function ViewToggle() {
  const tier = useTier();
  const view = useGallery((state) => state.view);
  const setView = useGallery((state) => state.setView);
  const demoted = useGallery((state) => state.demoted);

  if (tier === '2d') return null;

  const spatial = view === '3d' && !demoted;

  return (
    <button
      type="button"
      aria-pressed={spatial}
      onClick={() => {
        setView(spatial ? '2d' : '3d');
      }}
      className={`rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${
        spatial
          ? 'border-accent text-accent'
          : 'border-line text-text-2 hover:border-text-2 hover:text-text-1'
      }`}
    >
      <span className="sr-only">Vue </span>
      {spatial ? '3D' : '2D'}
    </button>
  );
}
