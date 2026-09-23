import { lazy } from 'react';

/*
 * Les démos, chargées à l'ouverture d'un composant et pas avant : Leaflet, la
 * carte et ses deux cent quarante marqueurs vivent dans un morceau à part que
 * la page d'accueil ne télécharge jamais.
 *
 * Une entrée par composant, en toutes lettres. Une table d'association serait
 * plus courte, mais elle fabriquerait le composant pendant le rendu, ce que
 * les règles du compilateur React refusent à juste titre : ici, chaque balise
 * pointe vers une constante de module, donc son identité ne change jamais.
 *
 * Ajouter un composant : un `lazy` et une ligne dans `Demo`. Un composant du
 * catalogue marqué `planned` n'a pas de démo, et n'a rien à faire ici.
 */
const StatusMap = lazy(() =>
  import('./showcase/status-map/Demo').then((module) => ({ default: module.StatusMapDemo })),
);

const FacetFilter = lazy(() =>
  import('./showcase/facet-filter/Demo').then((module) => ({ default: module.FacetFilterDemo })),
);

const BeforeAfter = lazy(() =>
  import('./showcase/before-after/Demo').then((module) => ({ default: module.BeforeAfterDemo })),
);

export function Demo({ id }: { id: string }) {
  if (id === 'status-map') return <StatusMap />;
  if (id === 'facet-filter') return <FacetFilter />;
  if (id === 'before-after') return <BeforeAfter />;
  return null;
}
