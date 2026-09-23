import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { catalog } from './src/catalog.ts';

const VIRTUAL = 'virtual:snippets';
const RESOLVED = '\0' + VIRTUAL;

/**
 * Colore les extraits de code au build.
 *
 * Shiki reste une dépendance de développement : le navigateur ne reçoit que du
 * HTML déjà coloré, donc zéro octet de JavaScript de coloration, et un extrait
 * lisible par les robots.
 */
function snippets(): Plugin {
  return {
    name: 'snippets-shiki',

    resolveId(id) {
      return id === VIRTUAL ? RESOLVED : null;
    },

    async load(id) {
      if (id !== RESOLVED) return null;

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

export default defineConfig({
  plugins: [react(), tailwindcss(), snippets()],
  /*
   * Base absolue : chaque composant a son fichier HTML dans un sous-dossier,
   * et un chemin relatif y pointerait à côté. Le site est donc servi à la
   * racine d'un domaine ou d'un sous-domaine.
   */
  base: '/',
  // Le port peut être imposé par l'outillage qui lance le serveur.
  server: { port: process.env['PORT'] ? Number(process.env['PORT']) : 5173 },
  build: { sourcemap: true },
});
