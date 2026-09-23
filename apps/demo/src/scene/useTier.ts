import { useState } from 'react';
import { chooseTier, readCapabilities, type Tier } from './tiers';

/*
 * Le palier est mesuré une seule fois par visite et mémorisé au niveau du
 * module : `matchMedia` et les indices matériels ne bougent pas en cours de
 * route, et deux composants qui posent la question doivent obtenir la même
 * réponse, sans quoi la bascule proposerait une 3D que la scène refuserait.
 */
let measured: Tier | null = null;

export function sceneTier(): Tier {
  measured ??= chooseTier(readCapabilities());
  return measured;
}

/**
 * Le palier, pendant le rendu.
 *
 * La mesure passe par l'initialiseur de `useState` plutôt que par un effet :
 * c'est la lecture d'un état extérieur qui ne changera pas de la visite, elle
 * n'a donc rien à synchroniser. La faire dans un effet imposerait un premier
 * rendu à vide suivi d'un second, soit un clignotement pour rien.
 */
export function useTier(): Tier {
  const [tier] = useState(sceneTier);
  return tier;
}
