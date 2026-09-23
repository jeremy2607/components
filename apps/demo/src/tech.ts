export type TechKind = 'lang' | 'lib' | 'tool';

export interface Tech {
  id: string;
  label: string;
  kind: TechKind;
  url: string;
}

/**
 * Les technos sont des noeuds partagés : deux composants qui utilisent React
 * pointent vers la même entrée. C'est ce qui fera du graphe 3D autre chose
 * qu'une étoile.
 */
export const TECH: readonly Tech[] = [
  { id: 'react', label: 'React 18', kind: 'lib', url: 'https://react.dev' },
  { id: 'typescript', label: 'TypeScript', kind: 'lang', url: 'https://www.typescriptlang.org' },
  { id: 'css', label: 'CSS', kind: 'lang', url: 'https://developer.mozilla.org/docs/Web/CSS' },
  { id: 'leaflet', label: 'Leaflet', kind: 'lib', url: 'https://leafletjs.com' },
  {
    id: 'markercluster',
    label: 'leaflet.markercluster',
    kind: 'lib',
    url: 'https://github.com/Leaflet/Leaflet.markercluster',
  },
  { id: 'vite', label: 'Vite', kind: 'tool', url: 'https://vite.dev' },
  { id: 'tsup', label: 'tsup', kind: 'tool', url: 'https://tsup.egoist.dev' },
  { id: 'vitest', label: 'Vitest', kind: 'tool', url: 'https://vitest.dev' },
  {
    id: 'testing-library',
    label: 'Testing Library',
    kind: 'tool',
    url: 'https://testing-library.com',
  },
  {
    id: 'intl',
    label: 'Intl',
    kind: 'lang',
    url: 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl',
  },
];

const BY_ID = new Map(TECH.map((tech) => [tech.id, tech]));

export function techById(id: string): Tech | undefined {
  return BY_ID.get(id);
}
