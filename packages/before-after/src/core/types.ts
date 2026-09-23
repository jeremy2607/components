/** Dimensions naturelles d'une image, en pixels. */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Ce que le composant a mesuré quand les deux couches ne se superposent pas.
 *
 * Il ne corrige rien : recadrer à la place de l'appelant reviendrait à choisir
 * ce qu'on lui coupe. Il dit ce qui ne va pas, et laisse décider.
 */
export interface MismatchReport {
  before: Dimensions;
  after: Dimensions;
  /** Rapports largeur / hauteur des deux couches. */
  ratios: { before: number; after: number };
  /** Écart relatif entre les deux rapports. `0.1` vaut dix pour cent. */
  drift: number;
}
