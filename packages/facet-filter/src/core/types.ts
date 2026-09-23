/**
 * Une facette : un axe de filtrage, ses valeurs possibles, et la façon de lire
 * celles que porte un élément.
 *
 * Le paquet ne connaît aucun domaine. `valuesOf` est le seul endroit où un
 * élément est interprété, et il vient de l'appelant.
 */
export interface Facet<T> {
  readonly id: string;
  /** Nom affiché du groupe. Le paquet n'embarque aucune prose. */
  readonly label: string;
  /** Valeurs proposées, dans l'ordre d'affichage. */
  readonly values: readonly string[];
  /** Valeurs portées par un élément : une, plusieurs, ou aucune. */
  readonly valuesOf: (item: T) => readonly string[] | string | undefined;
  /** Nom affiché d'une valeur. Par défaut, la valeur elle-même. */
  readonly labelFor?: (value: string) => string;
}

/**
 * Valeurs cochées, par facette.
 *
 * Une facette absente ou vide signifie « toutes », jamais « aucune ». C'est la
 * règle qui rend l'état initial équivalent à l'état sans filtre.
 */
export type FacetSelection = Readonly<Record<string, ReadonlySet<string>>>;

/** Comptes par facette puis par valeur. Lire avec `countOf`. */
export type FacetCounts = Readonly<Record<string, Readonly<Record<string, number>>>>;
