import { useEffect, useState } from 'react';

/**
 * Charge le parc après un court délai.
 *
 * La démo n'a pas de serveur, mais un composant de carte en aura un : ce délai
 * existe pour que l'état de chargement soit visible et vérifiable, plutôt que
 * d'être un chemin de code que personne ne voit jamais.
 */
export function useLoadingDelay(delayMs: number): boolean {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setLoading(false);
    }, delayMs);

    return () => {
      window.clearTimeout(id);
    };
  }, [delayMs]);

  return loading;
}
