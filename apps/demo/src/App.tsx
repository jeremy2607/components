import { useEffect } from 'react';
import { metaById } from './catalog';
import { useFullscreen, useRoute } from './router';
import { ComponentPage } from './ui/ComponentPage';
import { FullscreenDemo } from './ui/FullscreenDemo';
import { Header } from './ui/Header';
import { Home } from './ui/Home';
import { NotFound } from './ui/NotFound';
import { useDocumentMeta } from './ui/useDocumentMeta';

const HOME_TITLE = 'components — bibliothèque de composants React';
const HOME_DESCRIPTION =
  'Composants React publiables, tirés de projets réels : carte de supervision, filtre à facettes. Démos live, API documentée, décisions techniques expliquées.';

export function App() {
  const route = useRoute();
  const fullscreen = useFullscreen();
  const meta = route.name === 'component' ? metaById(route.id) : undefined;
  // Un composant « à venir » n'a pas de démo, donc pas de page.
  const playable = meta !== undefined && meta.status !== 'planned';

  // Une navigation interne ne doit pas garder la position de la page d'avant.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.name, meta?.id]);

  useDocumentMeta(HOME_TITLE, HOME_DESCRIPTION, '/');

  if (meta && playable && fullscreen) {
    return <FullscreenDemo id={meta.id} title={meta.title} />;
  }

  return (
    <>
      <Header />
      <main id="contenu">
        {route.name === 'home' && <Home />}
        {meta && playable && <ComponentPage meta={meta} />}
        {((route.name === 'component' && !playable) || route.name === 'inconnue') && <NotFound />}
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 font-mono text-[11px] text-text-2">
          <p>Jeremy Prat</p>
          {/* TODO Jeremy : tes liens. */}
          <p>MIT · TODO — GitHub, portfolio, contact</p>
        </div>
      </footer>
    </>
  );
}
