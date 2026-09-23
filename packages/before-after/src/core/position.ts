/*
 * La position du séparateur, en pourcentage de la largeur depuis le bord
 * gauche. À gauche du trait, l'avant ; à droite, l'après.
 *
 * Il n'y a presque rien ici, et c'est voulu : le déplacement au pointeur, les
 * touches fléchées, `Origine` et `Fin` sont assurés par l'`input[type=range]`
 * que le composant habille. Ce qui reste est ce que la plateforme ne fait pas
 * — borner, et lire une valeur qui vient d'un attribut, donc d'une chaîne.
 */

export const MIN_POSITION = 0;
export const MAX_POSITION = 100;
export const DEFAULT_POSITION = 50;

export function clampPosition(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_POSITION;
  return Math.min(MAX_POSITION, Math.max(MIN_POSITION, value));
}

/**
 * Lit la valeur d'un champ de formulaire.
 *
 * `input.value` est une chaîne, et rien ne garantit qu'elle soit un nombre :
 * un navigateur peut rendre une chaîne vide sur un champ jamais touché. Le
 * repli vaut mieux qu'un `NaN` qui se propagerait jusque dans le style.
 */
export function parsePosition(raw: string, fallback: number = DEFAULT_POSITION): number {
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? clampPosition(value) : clampPosition(fallback);
}
