/**
 * Points d'ancrage du parc fictif, sur la France métropolitaine.
 *
 * Les coordonnées sont réelles, les sites qui s'y accrochent sont inventés.
 * `weight` fabrique les grappes volontaires : Paris, Lyon et Nice concentrent
 * assez de sites pour que le regroupement ait de quoi montrer.
 * `bias` décale le centre du nuage vers l'intérieur des terres, pour que les
 * villes côtières ne sèment pas de sites en mer.
 */
export interface Anchor {
  lat: number;
  lng: number;
  weight: number;
  radiusKm: number;
  bias?: readonly [northKm: number, eastKm: number];
}

export const ANCHORS: readonly Anchor[] = [
  { lat: 48.8566, lng: 2.3522, weight: 58, radiusKm: 22 },
  { lat: 45.764, lng: 4.8357, weight: 42, radiusKm: 18 },
  { lat: 43.7102, lng: 7.262, weight: 36, radiusKm: 10, bias: [6, -4] },

  { lat: 43.2965, lng: 5.3698, weight: 9, radiusKm: 12, bias: [8, 0] },
  { lat: 43.6047, lng: 1.4442, weight: 9, radiusKm: 14 },
  { lat: 44.8378, lng: -0.5792, weight: 8, radiusKm: 14 },
  { lat: 47.2184, lng: -1.5536, weight: 7, radiusKm: 13 },
  { lat: 50.6292, lng: 3.0573, weight: 7, radiusKm: 13, bias: [-5, 0] },
  { lat: 48.5734, lng: 7.7521, weight: 6, radiusKm: 11, bias: [0, -5] },
  { lat: 48.1173, lng: -1.6778, weight: 6, radiusKm: 12 },
  { lat: 43.6108, lng: 3.8767, weight: 5, radiusKm: 11, bias: [7, 0] },
  { lat: 45.1885, lng: 5.7245, weight: 5, radiusKm: 10 },
  { lat: 47.322, lng: 5.0415, weight: 5, radiusKm: 11 },
  { lat: 45.7772, lng: 3.087, weight: 5, radiusKm: 11 },
  { lat: 49.2583, lng: 4.0317, weight: 4, radiusKm: 11 },
  { lat: 47.3941, lng: 0.6848, weight: 4, radiusKm: 11 },
  { lat: 47.9029, lng: 1.9093, weight: 4, radiusKm: 11 },
  { lat: 45.8336, lng: 1.2611, weight: 4, radiusKm: 11 },
  { lat: 49.1829, lng: -0.3707, weight: 4, radiusKm: 10, bias: [-4, 3] },
  { lat: 47.2378, lng: 6.0241, weight: 3, radiusKm: 10 },
  { lat: 49.1193, lng: 6.1757, weight: 3, radiusKm: 10 },
  { lat: 47.4784, lng: -0.5632, weight: 3, radiusKm: 10 },
  { lat: 43.2951, lng: -0.3708, weight: 3, radiusKm: 10 },
  { lat: 48.3904, lng: -4.4861, weight: 3, radiusKm: 9, bias: [-2, 6] },
  { lat: 42.6887, lng: 2.8948, weight: 3, radiusKm: 9, bias: [4, -5] },
];
