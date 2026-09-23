import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { layout, snippets } from './vite/virtual.ts';

export default defineConfig({
  /*
   * Les mêmes greffons que le build, et pour la même raison : un test qui
   * monte l'application traverse `CodeBlock` et la scène, donc il a besoin de
   * `virtual:snippets` et de `virtual:layout`. Les remplacer ici par des
   * jumeaux de test reviendrait à tester autre chose que ce qu'on livre.
   */
  plugins: [react(), snippets(), layout()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    restoreMocks: true,
  },
});
