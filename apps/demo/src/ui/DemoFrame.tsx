import { Suspense } from 'react';
import { Demo } from '../registry';
import { hrefFor } from '../router';
import { Link } from './Link';

interface DemoFrameProps {
  id: string;
  title: string;
}

function Chargement() {
  return (
    <p className="flex h-full items-center justify-center font-mono text-xs text-text-2">
      chargement de la démo
    </p>
  );
}

/**
 * La démo est le vrai composant, chargé seulement ici. Elle tient dans un
 * cadre par défaut, et prend l'écran sur demande : la même démo, deux
 * contenants.
 */
export function DemoFrame({ id, title }: DemoFrameProps) {
  return (
    <section aria-label={`Démo de ${title}`}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-text-2">Démo</h2>
        <Link
          href={`${hrefFor(id)}?demo=plein`}
          className="font-mono text-[11px] text-text-2 underline-offset-4 hover:text-accent hover:underline"
        >
          plein écran
        </Link>
      </div>

      <div className="h-[70vh] min-h-[26rem] overflow-hidden border border-line bg-ink-1">
        <Suspense fallback={<Chargement />}>
          <Demo id={id} />
        </Suspense>
      </div>
    </section>
  );
}
