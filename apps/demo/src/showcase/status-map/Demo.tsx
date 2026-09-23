import { useMemo, useState } from 'react';
import {
  StatusMap,
  type ClusterConfig,
  type DataQualityReport,
  type ViewConfig,
} from '@jeremyprat/status-map';
import { DataQualityNotice } from './components/DataQualityNotice';
import { SimulationControls } from './components/SimulationControls';
import { SitePanel } from './components/SitePanel';
import { SitePopup } from './components/SitePopup';
import { ThemeSwitch } from './components/ThemeSwitch';
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
import { useActivitySimulator } from './useActivitySimulator';
import { useLoadingDelay } from './useSiteLoader';
import { useTheme } from './useTheme';
import { useDismissible } from './useDismissible';

const view: ViewConfig = { defaultCenter: [46.6, 2.4], defaultZoom: 6 };

const cluster: ClusterConfig = {
  maxRadius: 80,
  spiderLegPolylineOptions: { weight: 2, color: '#5e6c84', opacity: 0.35 },
};

const LOCALE = 'fr-FR';

// Un seul parc par chargement de page, tiré à l'import : le rendu reste pur.
const parc = generateSites();
const EMPTY_PARC: readonly Site[] = [];

export function App() {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<SiteFilters>(EMPTY_FILTERS);
  const { dismissed, dismiss } = useDismissible('data-quality');
  const simulation = useActivitySimulator(parc);
  const theme = useTheme();
  const loading = useLoadingDelay(600);

  const sites = loading ? EMPTY_PARC : simulation.sites;
  const visible = useMemo(() => filterSites(sites, filters), [sites, filters]);
  const counts = useMemo(() => countsForToggles(sites, filters), [sites, filters]);
  const filtered = isFiltered(filters);

  // La sélection est un identifiant, pas un instantané : un statut qui bascule
  // ne doit pas laisser une copie périmée dans l'en-tête.
  const selected = selectedId ? (sites.find((site) => site.id === selectedId) ?? null) : null;
  const select = (site: Site) => {
    setSelectedId(site.id);
  };

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
          <ThemeSwitch mode={theme.mode} onChange={theme.setMode} />
          <SimulationControls
            running={simulation.running}
            changed={simulation.changed}
            disabled={loading}
            onToggle={simulation.toggle}
            onReset={simulation.reset}
          />
          {selected && (
            <p className="app__selection">
              <span className="app__selection-name">{selected.data.name}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                }}
              >
                Désélectionner
              </button>
            </p>
          )}
          <p className="app__count">{parc.length} sites</p>
        </div>
      </header>

      {report && !dismissed && <DataQualityNotice report={report} onDismiss={dismiss} />}

      <div className="app__body">
        <main className="app__map">
          {!loading && visible.length === 0 && (
            <p className="app__map-empty" role="status">
              Aucun site à afficher
            </p>
          )}
          <StatusMap
            items={visible}
            statuses={statuses}
            tiles={tiles}
            view={view}
            cluster={cluster}
            locale={LOCALE}
            selectedId={selectedId}
            onSelect={select}
            onDataQuality={setReport}
            renderPopup={(site, context) => (
              <SitePopup site={site} context={context} onOpenDetails={select} />
            )}
            labels={{
              map: 'Carte du parc',
              marker: (item, status) => `${item.data.name}, ${status.label ?? ''}`,
              cluster: (count, status) => `${count} sites, dont au moins un ${status.label ?? ''}`,
            }}
          />
        </main>

        <SitePanel
          sites={visible}
          total={parc.length}
          statuses={statuses}
          counts={counts}
          filters={filters}
          filtered={filtered}
          selectedId={selectedId}
          locale={LOCALE}
          loading={loading}
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
          onSelect={select}
        />
      </div>
    </div>
  );
}
