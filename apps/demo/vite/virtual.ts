/*
 * Les deux modules virtuels de la galerie, dans un fichier à part.
 *
 * Ils étaient définis dans `vite.config.ts`, donc invisibles pour Vitest, qui
 * a sa propre configuration : un test qui montait l'application butait sur un
 * `virtual:snippets` introuvable. Les extraire ici permet aux deux
 * configurations de charger exactement les mêmes greffons, plutôt que de
 * fabriquer pour les tests des jumeaux qui auraient fini par mentir.
 */
import type { Plugin } from 'vite';
import { catalog } from '../src/catalog.ts';
import { graph } from '../src/scene/graph.ts';
import { layoutGraph } from '../src/scene/layout.ts';

const SNIPPETS = 'virtual:snippets';
const RESOLVED_SNIPPETS = '\0' + SNIPPETS;

const LAYOUT = 'virtual:layout';
const RESOLVED_LAYOUT = '\0' + LAYOUT;

/**
 * Colore les extraits de code au build.
 *
 * Shiki reste une dépendance de développement : le navigateur ne reçoit que du
 * HTML déjà coloré, donc zéro octet de JavaScript de coloration, et un extrait
 * lisible par les robots.
 */
export function snippets(): Plugin {
  return {
    name: 'snippets-shiki',

    resolveId(id) {
      return id === SNIPPETS ? RESOLVED_SNIPPETS : null;
    },

    async load(id) {
      if (id !== RESOLVED_SNIPPETS) return null;

      const { codeToHtml } = await import('shiki');
      const colored = await Promise.all(
        catalog
          .filter((meta) => meta.snippet !== '')
          .map(async (meta) => {
            const html = await codeToHtml(meta.snippet, { lang: 'tsx', theme: 'min-dark' });
            // Le fond vient de nos jetons, pas du thème Shiki.
            return [meta.id, html.replace(/background-color:[^;"]+;?/g, '')] as const;
          }),
      );

      return `export default ${JSON.stringify(Object.fromEntries(colored))};`;
    },
  };
}

/**
 * Calcule le placement des noeuds au build et le sert en JSON.
 *
 * Le graphe ne bouge pas entre deux visites : la force dirigée tourne ici, une
 * fois, et le navigateur ne reçoit que des coordonnées. C'est ce qui rend un
 * lien profond possible — `/components/status-map` sait où poser la caméra —
 * et ce qui met le coût de la simulation à zéro à l'exécution.
 *
 * Passer par un module virtuel plutôt que par un fichier commité évite la
 * seule vraie faiblesse d'un JSON figé : il ne peut pas se désynchroniser du
 * catalogue, puisqu'il en est recalculé à chaque build.
 */
export function layout(): Plugin {
  return {
    name: 'scene-layout',

    resolveId(id) {
      return id === LAYOUT ? RESOLVED_LAYOUT : null;
    },

    load(id) {
      if (id !== RESOLVED_LAYOUT) return null;
      return `export default ${JSON.stringify(layoutGraph(graph))};`;
    },
  };
}
