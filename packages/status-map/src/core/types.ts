/** Couple latitude / longitude, en degres decimaux. */
export type LatLngTuple = readonly [lat: number, lng: number];

/** Couple de pixels, utilise pour les marges de cadrage. */
export type PointTuple = readonly [x: number, y: number];

/**
 * Un élément positionné sur la carte.
 *
 * `lat` et `lng` sont facultatifs : un parc réel contient toujours des éléments
 * dont les coordonnées manquent. Ils sont alors exclus de la carte et comptés
 * dans le rapport de qualité des données.
 */
export interface StatusItem<K extends string = string, D = unknown> {
  id: string;
  lat?: number | null;
  lng?: number | null;
  status: K;
  data?: D;
}

/** Ajoute des coordonnées exploitables à un élément, en préservant son type. */
export type Located<T> = T & { lat: number; lng: number };

/** Élément dont les coordonnées sont exploitables. Voir `isLocated`. */
export type LocatedItem<K extends string = string, D = unknown> = Located<StatusItem<K, D>>;

/** Fond de carte. Injecté par le consommateur, jamais codé en dur. */
export interface TileConfig {
  url: string;
  attribution: string;
  subdomains?: string | string[];
  maxZoom?: number;
  minZoom?: number;
  className?: string;
}

/** Cadrage initial et ses valeurs de repli. */
export interface ViewConfig {
  /** Utilisé quand aucun élément n'est géolocalisé. */
  defaultCenter: LatLngTuple;
  /** Défaut : 5. */
  defaultZoom?: number;
  /** Zoom applique quand il n'y a qu'une seule position. Défaut : 12. */
  singleItemZoom?: number;
  /** Marge intérieure du cadrage, en pixels. Défaut : [48, 48]. */
  padding?: PointTuple;
  /** Plafond du cadrage, evite un zoom inutilisable sur une grappe serree. Défaut : 13. */
  maxZoom?: number;
}

/**
 * Etat de complétude des coordonnées.
 *
 * `severity` distingue deux cas que l'appelant doit traiter differemment :
 * plus rien a afficher (`error`) ou affichage partiel (`warning`).
 */
export interface DataQualityReport {
  total: number;
  located: number;
  missing: number;
  missingIds: readonly string[];
  severity: 'error' | 'warning' | null;
}

/** Libelles visibles. Le paquet n'embarque aucune prose. */
export interface StatusMapLabels {
  /** Nom accessible du conteneur de carte. */
  map?: string;
}
