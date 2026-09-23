/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPTILER_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Extraits de code colorés au build par le greffon `virtual:snippets`. */
declare module 'virtual:snippets' {
  const snippets: Readonly<Record<string, string>>;
  export default snippets;
}

/**
 * Coordonnées des noeuds, calculées au build par le greffon `virtual:layout`.
 * Le navigateur ne simule aucune force : il lit des positions.
 */
declare module 'virtual:layout' {
  // Structure décrite sur place plutôt qu'importée : un module ambiant qui va
  // chercher un type dans le projet se résout mal selon l'outil qui le lit.
  // C'est exactement le `Layout` de `scene/layout.ts`.
  const layout: Readonly<Record<string, { x: number; y: number; z: number }>>;
  export default layout;
}
