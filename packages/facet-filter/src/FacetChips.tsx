import type { ReactNode } from 'react';
import { countOf } from './core/counts';
import { selectedValues } from './core/select';
import type { Facet, FacetCounts, FacetSelection } from './core/types';

export interface ChipContext {
  value: string;
  label: string;
  count: number;
  selected: boolean;
}

export interface FacetChipsProps<T> {
  facet: Facet<T>;
  counts: FacetCounts;
  selection: FacetSelection;
  onToggle: (facetId: string, value: string) => void;
  /** Contenu libre d'une puce. Par défaut : le libellé et le compte. */
  renderValue?: (context: ChipContext) => ReactNode;
}

/**
 * Un groupe de puces à bascule pour une facette.
 *
 * Une valeur à zéro qui n'est pas déjà cochée est désactivée : la cocher ne
 * changerait rien à l'affichage, et un bouton qui ne fait rien est un piège.
 * Une valeur cochée reste cliquable même à zéro, sinon on ne pourrait plus la
 * décocher.
 */
export function FacetChips<T>({
  facet,
  counts,
  selection,
  onToggle,
  renderValue,
}: FacetChipsProps<T>) {
  const active = selectedValues(selection, facet.id);

  return (
    <fieldset className="ff-group">
      <legend className="ff-group__legend">{facet.label}</legend>
      <ul className="ff-group__list">
        {facet.values.map((value) => {
          const count = countOf(counts, facet.id, value);
          const selected = active.has(value);
          const label = facet.labelFor?.(value) ?? value;

          return (
            <li key={value}>
              <button
                type="button"
                className="ff-chip"
                aria-pressed={selected}
                disabled={count === 0 && !selected}
                onClick={() => {
                  onToggle(facet.id, value);
                }}
              >
                {renderValue ? (
                  renderValue({ value, label, count, selected })
                ) : (
                  <>
                    <span className="ff-chip__label">{label}</span>
                    <span className="ff-chip__count">{count}</span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
