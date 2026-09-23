import { useEffect } from 'react';
import { metaById } from './catalog';
import { hrefFor, useFullscreen, useRoute } from './router';
import { SceneHost } from './scene/SceneHost';
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

  /*
   * Les métadonnées sont décidées ici, et ici seulement.
   *
   * Elles vivaient à deux endroits : `App` posait celles de l'accueil, la page
   * d'un composant posait les siennes. React exécutant les effets des enfants
   * avant ceux du parent, la page posait les bonnes valeurs et `App` les
   * écrasait aussitôt par celles de l'accueil. Le HTML pré-rendu restait juste,
   * mais dès que React montait, le titre, la description et l'URL canonique de
   * chaque composant redevenaient ceux de la page d'accueil — y compris pour
   * les robots qui exécutent le JavaScript. Une seule source, plus de course.
   */
  useDocumentMeta(
    playable && meta ? meta.seo.title : HOME_TITLE,
    playable && meta ? meta.seo.description : HOME_DESCRIPTION,
    playable && meta ? hrefFor(meta.id) : '/',
  );

  if (meta && playable && fullscreen) {
    return <FullscreenDemo id={meta.id} title={meta.title} />;
  }

  return (
    <>
      <Header />
      {/*
       * La scène vit au-dessus des pages, pas dedans : naviguer d'un composant
       * à l'autre y fait plonger la caméra et déplier le noeud, au lieu de
       * démonter puis remonter un canevas et de repartir de la vue d'ensemble.
       * Le plein écran d'une démo, lui, sort tout le reste de l'écran.
       */}
      <SceneHost focus={playable && meta ? meta.id : null} />
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
