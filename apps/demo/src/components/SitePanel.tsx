import { useId } from 'react';
import type { StatusRegistry } from '@jeremyprat/status-map';
import type { Site, SiteStatus, SiteTag } from '../data/types';
import type { SiteFilters, StatusCounts } from '../filters';
import { Legend } from './Legend';
import { PanelSkeleton } from './PanelSkeleton';
import { SiteListItem } from './SiteListItem';
import { StatusCounters } from './StatusCounters';
import { TagFilter } from './TagFilter';

interface SitePanelProps {
  sites: readonly Site[];
  total: number;
  statuses: StatusRegistry<SiteStatus>;
  counts: StatusCounts;
  filters: SiteFilters;
  filtered: boolean;
  selectedId: string | null;
  locale: string;
  loading: boolean;
  onSearch: (search: string) => void;
  onToggleStatus: (status: SiteStatus) => void;
  onToggleTag: (tag: SiteTag) => void;
  onReset: () => void;
  onSelect: (site: Site) => void;
}

export function SitePanel({
  sites,
  total,
  statuses,
  counts,
  filters,
  filtered,
  selectedId,
  locale,
  loading,
  onSearch,
  onToggleStatus,
  onToggleTag,
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
            value={filters.search}
            placeholder="Nom ou modèle"
            onChange={(event) => {
              onSearch(event.target.value);
            }}
          />
        </div>

        <StatusCounters
          statuses={statuses}
          counts={counts}
          active={filters.statuses}
          onToggle={onToggleStatus}
        />

        <TagFilter active={filters.tags} onToggle={onToggleTag} />
      </div>

      <div className="panel__summary">
        <p className="panel__count">
          {loading ? 'Chargement du parc' : `${sites.length} sur ${total}`}
        </p>
        {filtered && !loading && (
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
          {sites.map((site) => {
            const definition = statuses[site.status];
            return (
              <SiteListItem
                key={site.id}
                site={site}
                definition={definition}
                selected={site.id === selectedId}
                locale={locale}
                onSelect={onSelect}
              />
            );
          })}
        </ul>
      )}

      <Legend statuses={statuses} />
    </aside>
  );
}
