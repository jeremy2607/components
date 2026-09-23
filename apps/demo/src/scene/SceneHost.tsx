import { lazy, Suspense } from 'react';
import { useGallery } from '../store/useGallery';
import { settingsFor } from './tiers';
import { useTier } from './useTier';

/*
 * La frontière paresseuse.
 *
 * `import('./Scene')` est le seul chemin vers three.js : tant que le visiteur
 * reste en 2D, ou que sa machine ne tient pas la scène, le morceau n'est
 * jamais demandé. C'est ce qui garde le coût initial de la galerie à son
 * budget, la 3D étant facturée après le premier rendu, et seulement à ceux qui
 * la voient.
 */
const Scene = lazy(() => import('./Scene'));

interface SceneHostProps {
  /** Le composant de la route courante : la caméra s'y rend et le déplie. */
  focus: string | null;
}

export function SceneHost({ focus }: SceneHostProps) {
  const tier = useTier();
  const view = useGallery((state) => state.view);
  const demoted = useGallery((state) => state.demoted);

  // `settingsFor` rend une constante de module : son identité ne change pas,
  // donc la scène n'est pas reconstruite à chaque rendu de la galerie.
  const settings = settingsFor(tier);
  if (settings === null || view !== '3d' || demoted) return null;

  return (
    <div className="h-[62vh] min-h-[22rem] border-b border-line bg-ink-0 sm:h-[68vh]">
      <Suspense fallback={null}>
        <Scene focus={focus} settings={settings} tier={tier} />
      </Suspense>
    </div>
  );
}
