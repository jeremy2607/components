import { useId } from 'react';
import {
  FacetChips,
  type Facet,
  type FacetCounts,
  type FacetSelection,
} from '@jeremyprat/facet-filter';
import type { StatusRegistry } from '@jeremyprat/status-map';
import type { Site, SiteStatus } from '../../../data/types';
import { Legend } from './Legend';
import { PanelSkeleton } from './PanelSkeleton';
import { SiteListItem } from './SiteListItem';
import { StatusCounters } from './StatusCounters';

interface SitePanelProps {
  sites: readonly Site[];
  total: number;
  statuses: StatusRegistry<SiteStatus>;
  statusFacet: Facet<Site>;
  tagsFacet: Facet<Site>;
  counts: FacetCounts;
  selection: FacetSelection;
  search: string;
  narrowed: boolean;
  selectedId: string | null;
  locale: string;
  loading: boolean;
  onSearch: (search: string) => void;
  onToggle: (facetId: string, value: string) => void;
  onReset: () => void;
  onSelect: (site: Site) => void;
}

export function SitePanel({
  sites,
  total,
  statuses,
  statusFacet,
  tagsFacet,
  counts,
  selection,
  search,
  narrowed,
  selectedId,
  locale,
  loading,
  onSearch,
  onToggle,
  onReset,
  onSelect,
}: SitePanelProps) {
  const searchId = useId();

  return (
    <aside className="panel" aria-label="Liste des sites">
      <div className="panel__controls">
        <div className="field">
          <label className="field__label" htmlFor={searchId}>
            Rechercher un site
          </label>
          <input
            id={searchId}
            className="field__input"
            type="search"
            value={search}
            placeholder="Nom ou modèle"
            onChange={(event) => {
              onSearch(event.target.value);
            }}
          />
        </div>

        <StatusCounters
          facet={statusFacet}
          statuses={statuses}
          counts={counts}
          selection={selection}
          onToggle={onToggle}
        />

        <FacetChips facet={tagsFacet} counts={counts} selection={selection} onToggle={onToggle} />
      </div>

      <div className="panel__summary">
        <p className="panel__count">
          {loading ? 'Chargement du parc' : `${sites.length} sur ${total}`}
        </p>
        {narrowed && !loading && (
          <button type="button" className="panel__reset" onClick={onReset}>
            Tout effacer
          </button>
        )}
      </div>

      {loading ? (
        <PanelSkeleton />
      ) : sites.length === 0 ? (
        <p className="panel__empty">
          Aucun site ne correspond à ces filtres.
          <button type="button" className="panel__reset" onClick={onReset}>
            Tout effacer
          </button>
        </p>
      ) : (
        <ul className="panel__list">
          {sites.map((site) => (
            <SiteListItem
              key={site.id}
              site={site}
              definition={statuses[site.status]}
              selected={site.id === selectedId}
              locale={locale}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}

      <Legend statuses={statuses} />
    </aside>
  );
}
