import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  /*
   * Base relative : l'artefact fonctionne à la racine d'un domaine comme dans
   * un sous-dossier, sans rebuild. La démo n'a pas de routage côté client,
   * donc rien ne dépend d'un chemin absolu.
   */
  base: './',
  build: { sourcemap: true },
});
