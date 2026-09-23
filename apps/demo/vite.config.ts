import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { layout, snippets } from './vite/virtual.ts';

export default defineConfig({
  plugins: [react(), tailwindcss(), snippets(), layout()],
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
