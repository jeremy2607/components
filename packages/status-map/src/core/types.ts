import type * as L from 'leaflet';
import type { ReactNode } from 'react';

declare module 'leaflet' {
  interface MarkerOptions {
    /**
     * Statut porté par le marqueur lui-même, renseigné par `StatusMap`.
     *
     * Le regroupement lit cette valeur, jamais un nom de classe CSS : la
     * sévérité est une donnée, pas une apparence.
     */
    status?: string;
  }
}

/** Couple latitude / longitude, en degrés décimaux. */
export type LatLngTuple = readonly [lat: number, lng: number];

/** Couple de pixels, utilisé pour les marges de cadrage. */
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

/** Borne minimale d'un élément de carte. Sert de contrainte aux génériques. */
export type AnyStatusItem = StatusItem<string, unknown>;

/** Élément dont les coordonnées sont exploitables. Voir `isLocated`. */
export type LocatedItem<K extends string = string, D = unknown> = Located<StatusItem<K, D>>;

/**
 * Apparence et gravité d'un statut.
 *
 * `severity` est la seule source de vérité pour la couleur d'un regroupement :
 * plus la valeur est haute, plus le statut est grave.
 */
export interface StatusDefinition {
  color: string;
  severity: number;
  /**
   * Contenu SVG dessiné dans une boîte de 24 par 24, par exemple un `<path>`.
   * Rendu une seule fois par statut, jamais une fois par marqueur.
   */
  icon?: ReactNode;
  /** Statut en toutes lettres, repris par les noms accessibles. */
  label?: string;
}

/** Registre ouvert : ajouter un statut, c'est ajouter une entrée. */
export type StatusRegistry<K extends string = string> = Readonly<Record<K, StatusDefinition>>;

/**
 * Vue élargie du registre, pour les recherches à l'exécution.
 *
 * Un statut lu sur un marqueur est une chaîne quelconque, et rien ne garantit
 * que le registre la décrive : le type le dit plutôt que de le supposer.
 */
export type StatusLookup = Readonly<Record<string, StatusDefinition | undefined>>;

/**
 * Regroupement des éléments proches.
 *
 * Les noms d'options reprennent ceux du greffon `leaflet.markercluster`, qui
 * ignore en silence toute option mal orthographiée : `zoomToBoundsOnClick` et
 * `spiderLegPolylineOptions` prennent bien un « s ».
 */
export interface ClusterConfig {
  /** Défaut : true. À false, chaque élément garde son marqueur. */
  enabled?: boolean;
  /** Rayon de regroupement en pixels. Défaut : 80. */
  maxRadius?: number;
  /** Défaut : true. */
  spiderfyOnMaxZoom?: boolean;
  /** Défaut : 3. Écarte les marqueurs déployés pour les rendre cliquables. */
  spiderfyDistanceMultiplier?: number;
  /** Défaut : false. */
  showCoverageOnHover?: boolean;
  /** Défaut : true. */
  removeOutsideVisibleBounds?: boolean;
  /** Défaut : true. */
  zoomToBoundsOnClick?: boolean;
  /** Au-delà de ce zoom, plus aucun regroupement. */
  disableClusteringAtZoom?: number;
  /** Trait des pattes de déploiement. */
  spiderLegPolylineOptions?: L.PolylineOptions;
}

/** Bulle d'information au survol. */
export interface PopupConfig {
  /**
   * Délai avant fermeture, en millisecondes. Défaut : 200.
   *
   * Il existe un vide entre le marqueur et la bulle : sans ce délai, le
   * curseur ne peut pas le traverser sans la faire disparaître.
   */
  closeDelay?: number;
  /** Décalage de la bulle. Par défaut, calculé depuis la taille du marqueur. */
  offset?: PointTuple;
  /** Défaut : 320. */
  maxWidth?: number;
  className?: string;
}

/** Contexte remis à `renderPopup`. */
export interface PopupContext<K extends string = string> {
  status: StatusDefinition;
  statusKey: K;
  /** Ferme la bulle sans attendre la sortie du curseur. */
  close: () => void;
  locale: string | undefined;
}

/** Géométrie des marqueurs. Les ancres en découlent. */
export interface MarkerConfig {
  /** Côté de la pastille, en pixels. Défaut : 36. */
  size?: number;
}

/** Fond de carte raster, décrit par son gabarit d'URL. */
export interface TileConfig {
  url: string;
  attribution: string;
  subdomains?: string | string[];
  maxZoom?: number;
  minZoom?: number;
  className?: string;
}

/**
 * Fond de carte quelconque, construit par le consommateur.
 *
 * Toutes les cartes ne sont pas des tuiles raster : une couche vectorielle
 * MapLibre, une couche WMS ou un fond maison sont des couches Leaflet comme
 * les autres. Le paquet ne veut pas connaître leur forme, seulement pouvoir
 * les poser et les retirer.
 */
export interface BasemapLayer {
  /** Construit la couche. Appelée une fois par carte. */
  create: () => L.Layer;
  /**
   * Zoom maximum de la carte.
   *
   * Requis : une couche quelconque ne le déclare pas forcément, et le
   * regroupement refuse de démarrer sur un zoom maximum infini.
   */
  maxZoom: number;
  minZoom?: number;
}

/** Fond de carte. Injecté par le consommateur, jamais codé en dur. */
export type BasemapConfig = TileConfig | BasemapLayer;

export function isBasemapLayer(config: BasemapConfig): config is BasemapLayer {
  return typeof (config as BasemapLayer).create === 'function';
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

/** Libellés visibles. Le paquet n'embarque aucune prose. */
export interface StatusMapLabels<T extends AnyStatusItem = StatusItem> {
  /** Nom accessible du conteneur de carte. */
  map?: string;
  /**
   * Nom accessible d'un marqueur. Par défaut, l'identifiant suivi du libellé
   * du statut : une interpolation de vos données, aucune phrase du paquet.
   */
  marker?: (item: T, status: StatusDefinition, key: T['status']) => string;
  /**
   * Nom accessible d'un regroupement. Par défaut, le nombre d'éléments suivi
   * du libellé du statut le plus grave.
   */
  cluster?: (count: number, status: StatusDefinition, key: T['status']) => string;
}
