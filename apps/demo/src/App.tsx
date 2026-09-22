import { useMemo, useState } from 'react';
import {
  StatusMap,
  type ClusterConfig,
  type DataQualityReport,
  type ViewConfig,
} from '@jeremyprat/status-map';
import { DataQualityNotice } from './components/DataQualityNotice';
import { SitePanel } from './components/SitePanel';
import { SitePopup } from './components/SitePopup';
import { generateSites } from './data/generateSites';
import type { Site, SiteStatus, SiteTag } from './data/types';
import {
  EMPTY_FILTERS,
  countsForToggles,
  filterSites,
  isFiltered,
  toggle,
  type SiteFilters,
} from './filters';
import { statuses } from './statuses';
import { tiles } from './tiles';
import { useDismissible } from './useDismissible';

const view: ViewConfig = { defaultCenter: [46.6, 2.4], defaultZoom: 6 };

const cluster: ClusterConfig = {
  maxRadius: 80,
  spiderLegPolylineOptions: { weight: 2, color: '#5e6c84', opacity: 0.35 },
};

const LOCALE = 'fr-FR';

// Un seul parc par chargement de page, tiré à l'import : le rendu reste pur.
const sites = generateSites();

export function App() {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [selected, setSelected] = useState<Site | null>(null);
  const [filters, setFilters] = useState<SiteFilters>(EMPTY_FILTERS);
  const { dismissed, dismiss } = useDismissible('data-quality');

  const visible = useMemo(() => filterSites(sites, filters), [filters]);
  const counts = useMemo(() => countsForToggles(sites, filters), [filters]);
  const filtered = isFiltered(filters);

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1 className="app__title">status-map</h1>
          <p className="app__tagline">
            Carte de supervision d'un parc de sites, clustering coloré par sévérité.
          </p>
        </div>
        <div className="app__aside">
          {selected && (
            <p className="app__selection">
              <span className="app__selection-name">{selected.data.name}</span>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                }}
              >
                Désélectionner
              </button>
            </p>
          )}
          <p className="app__count">{sites.length} sites</p>
        </div>
      </header>

      {report && !dismissed && <DataQualityNotice report={report} onDismiss={dismiss} />}

      <div className="app__body">
        <SitePanel
          sites={visible}
          total={sites.length}
          statuses={statuses}
          counts={counts}
          filters={filters}
          filtered={filtered}
          selectedId={selected?.id ?? null}
          locale={LOCALE}
          onSearch={(search) => {
            setFilters((current) => ({ ...current, search }));
          }}
          onToggleStatus={(status: SiteStatus) => {
            setFilters((current) => ({ ...current, statuses: toggle(current.statuses, status) }));
          }}
          onToggleTag={(tag: SiteTag) => {
            setFilters((current) => ({ ...current, tags: toggle(current.tags, tag) }));
          }}
          onReset={() => {
            setFilters(EMPTY_FILTERS);
          }}
          onSelect={setSelected}
        />

        <main className="app__map">
          <StatusMap
            items={visible}
            statuses={statuses}
            tiles={tiles}
            view={view}
            cluster={cluster}
            locale={LOCALE}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
            onDataQuality={setReport}
            renderPopup={(site, context) => (
              <SitePopup site={site} context={context} onOpenDetails={setSelected} />
            )}
            labels={{
              map: 'Carte du parc',
              marker: (item, status) => `${item.data.name}, ${status.label ?? ''}`,
              cluster: (count, status) => `${count} sites, dont au moins un ${status.label ?? ''}`,
            }}
          />
        </main>
      </div>
    </div>
  );
}
