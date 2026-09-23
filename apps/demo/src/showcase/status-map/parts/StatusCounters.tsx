import {
  countOf,
  selectedValues,
  type Facet,
  type FacetCounts,
  type FacetSelection,
} from '@jeremyprat/facet-filter';
import type { StatusRegistry } from '@jeremyprat/status-map';
import type { Site, SiteStatus } from '../../../data/types';

interface StatusCountersProps {
  facet: Facet<Site>;
  statuses: StatusRegistry<SiteStatus>;
  counts: FacetCounts;
  selection: FacetSelection;
  onToggle: (facetId: string, value: string) => void;
}

/**
 * Rendu maison de la facette « statut » : lire et filtrer sont le même geste.
 *
 * Le paquet fournit les comptes, pas cette mise en forme. C'est l'intérêt
 * d'un filtre sans opinion visuelle : la même facette se rend en puces
 * discrètes ailleurs et en gros chiffres ici.
 */
export function StatusCounters({
  facet,
  statuses,
  counts,
  selection,
  onToggle,
}: StatusCountersProps) {
  const active = selectedValues(selection, facet.id);

  return (
    <ul className="counters">
      {facet.values.map((value) => {
        const definition = statuses[value as SiteStatus];
        const count = countOf(counts, facet.id, value);
        const selected = active.has(value);

        return (
          <li key={value}>
            <button
              type="button"
              className="counter"
              aria-pressed={selected}
              disabled={count === 0 && !selected}
              onClick={() => {
                onToggle(facet.id, value);
              }}
            >
              <span
                className="counter__dot"
                style={{ background: definition.color }}
                aria-hidden="true"
              />
              <span className="counter__value">{count}</span>
              <span className="counter__label">{definition.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
