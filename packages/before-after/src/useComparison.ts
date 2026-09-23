import { useCallback, useState } from 'react';
import { clampPosition, DEFAULT_POSITION, parsePosition } from './core/position';

export interface UseComparisonOptions {
  /** Position pilotée depuis l'extérieur. Absente, le composant la retient. */
  position?: number;
  defaultPosition?: number;
  onPositionChange?: (position: number) => void;
}

export interface ComparisonState {
  position: number;
  /** À brancher sur l'événement `change` du champ : il reçoit `input.value`. */
  move: (raw: string) => void;
}

/**
 * La position du séparateur, pilotée ou retenue.
 *
 * Le composant reste utilisable sans rien brancher, et se laisse piloter quand
 * la page a son mot à dire — deux comparateurs qu'on veut garder alignés, une
 * position qu'on restaure depuis l'URL. La règle habituelle s'applique : si
 * `position` est fournie, elle fait foi, et le composant se contente de
 * prévenir du mouvement sans jamais décider de lui-même.
 */
export function useComparison({
  position,
  defaultPosition = DEFAULT_POSITION,
  onPositionChange,
}: UseComparisonOptions): ComparisonState {
  const [internal, setInternal] = useState(() => clampPosition(defaultPosition));

  const controlled = position !== undefined;
  const current = controlled ? clampPosition(position) : internal;

  const move = useCallback(
    (raw: string) => {
      const next = parsePosition(raw, current);
      if (!controlled) setInternal(next);
      onPositionChange?.(next);
    },
    [controlled, current, onPositionChange],
  );

  return { position: current, move };
}
