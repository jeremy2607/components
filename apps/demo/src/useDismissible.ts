import { useCallback, useState } from 'react';

const PREFIX = 'status-map-demo:';

/**
 * Message rejetable pour la durée de la session.
 *
 * Le rejet survit aux remontages de la page mais pas à la fermeture de
 * l'onglet : un avertissement sur les données doit revenir à la visite
 * suivante, pas à chaque rendu.
 */
export function useDismissible(key: string): { dismissed: boolean; dismiss: () => void } {
  const storageKey = PREFIX + key;
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(storageKey) === '1');

  const dismiss = useCallback(() => {
    sessionStorage.setItem(storageKey, '1');
    setDismissed(true);
  }, [storageKey]);

  return { dismissed, dismiss };
}
