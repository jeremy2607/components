import { useLayoutEffect, useRef } from 'react';

/**
 * Garde la derniere valeur lisible depuis un effet ou un rappel imperatif, sans
 * la faire entrer dans les dependances.
 *
 * L'écriture passe par un effet de mise en page : affecter une ref pendant le
 * rendu casse le rendu concurrent, où un rendu peut être abandonné puis rejoué.
 */
export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value);

  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
