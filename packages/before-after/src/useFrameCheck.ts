import { useEffect, type RefObject } from 'react';
import { compareFrames, DEFAULT_TOLERANCE } from './core/ratio';
import type { MismatchReport } from './core/types';

/**
 * Vérifie que les deux couches cadrent la même chose.
 *
 * Le paquet ne charge pas les images — il reçoit des `ReactNode` — mais il
 * peut regarder celles qu'on lui a confiées. S'il trouve une balise `img` de
 * chaque côté, il compare leurs dimensions naturelles une fois chargées et
 * prévient. S'il n'en trouve pas, parce que l'appelant a passé un `<picture>`,
 * une `<video>` ou un fond CSS, il se tait : mieux vaut ne rien dire que dire
 * faux.
 *
 * Signalé une seule fois par montage. Un avertissement répété à chaque rendu
 * finit ignoré, et c'est un défaut de cadrage, pas un état qui évolue.
 */
export function useFrameCheck(
  beforeRef: RefObject<HTMLElement | null>,
  afterRef: RefObject<HTMLElement | null>,
  onMismatch: ((report: MismatchReport) => void) | undefined,
  tolerance: number = DEFAULT_TOLERANCE,
): void {
  useEffect(() => {
    if (!onMismatch) return;

    const before = beforeRef.current?.querySelector('img');
    const after = afterRef.current?.querySelector('img');
    if (!before || !after) return;

    let reported = false;

    function check(): void {
      if (reported || !before || !after) return;
      // Une image pas encore décodée annonce des dimensions nulles : attendre
      // plutôt que de conclure sur du vide.
      if (!before.complete || !after.complete) return;

      reported = true;
      const report = compareFrames(
        { width: before.naturalWidth, height: before.naturalHeight },
        { width: after.naturalWidth, height: after.naturalHeight },
        tolerance,
      );
      if (report) onMismatch?.(report);
    }

    check();
    before.addEventListener('load', check);
    after.addEventListener('load', check);

    return () => {
      before.removeEventListener('load', check);
      after.removeEventListener('load', check);
    };
  }, [beforeRef, afterRef, onMismatch, tolerance]);
}
