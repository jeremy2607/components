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
