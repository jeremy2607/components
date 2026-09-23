import { useMemo, useState } from 'react';
import { useFacetFilter } from '@jeremyprat/facet-filter';
import {
  StatusMap,
  type ClusterConfig,
  type DataQualityReport,
  type ViewConfig,
} from '@jeremyprat/status-map';
import 'leaflet/dist/leaflet.css';
// Animations de regroupement. MarkerCluster.Default.css n'est pas importé :
// c'est l'apparence par défaut du greffon, que status-map remplace.
import 'leaflet.markercluster/dist/MarkerCluster.css';
import '@jeremyprat/status-map/styles.css';
import './demo.css';
import { SITE_FACETS, STATUS_FACET, TAGS_FACET, searchPredicate } from '../../data/filters';
import { generateSites } from '../../data/generateSites';
import { statuses } from '../../data/statuses';
import type { Site } from '../../data/types';
import { DataQualityNotice } from './parts/DataQualityNotice';
import { SimulationControls } from './parts/SimulationControls';
import { SitePanel } from './parts/SitePanel';
import { SitePopup } from './parts/SitePopup';
import { tiles } from './tiles';
import { useActivitySimulator } from './useActivitySimulator';
import { useDismissible } from './useDismissible';
import { useLoadingDelay } from './useSiteLoader';
import { guardWheelZoom } from './wheelGuard';

const view: ViewConfig = { defaultCenter: [46.6, 2.4], defaultZoom: 6 };

const cluster: ClusterConfig = {
  maxRadius: 80,
  spiderLegPolylineOptions: { weight: 2, color: '#7f8ea6', opacity: 0.35 },
};

const LOCALE = 'fr-FR';

// Un seul parc par chargement de page, tiré à l'import : le rendu reste pur.
const parc = generateSites();
const EMPTY_PARC: readonly Site[] = [];

export function StatusMapDemo() {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { dismissed, dismiss } = useDismissible('data-quality');
  const simulation = useActivitySimulator(parc);
  const loading = useLoadingDelay(600);

  const sites = loading ? EMPTY_PARC : simulation.sites;

  // Mémoïsé : c'est une dépendance du filtrage et des comptes.
  const match = useMemo(() => searchPredicate(search), [search]);
  const {
    items: visible,
    counts,
    selection,
    filtered,
    toggle,
    clear,
  } = useFacetFilter({ items: sites, facets: SITE_FACETS, match });

  // Le paquet ne connaît que les facettes : la recherche se compte ici.
  const narrowed = filtered || match !== undefined;
  const reset = () => {
    clear();
    setSearch('');
  };

  // La sélection est un identifiant, pas un instantané : un statut qui bascule
  // ne doit pas laisser une copie périmée dans l'en-tête.
  const selected = selectedId ? (sites.find((site) => site.id === selectedId) ?? null) : null;
  const select = (site: Site) => {
    setSelectedId(site.id);
  };

  return (
    <div className="app">
      <div className="app__toolbar">
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
            onReady={guardWheelZoom}
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
          statusFacet={STATUS_FACET}
          tagsFacet={TAGS_FACET}
          counts={counts}
          selection={selection}
          search={search}
          narrowed={narrowed}
          selectedId={selectedId}
          locale={LOCALE}
          loading={loading}
          onSearch={setSearch}
          onToggle={toggle}
          onReset={reset}
          onSelect={select}
        />
      </div>
    </div>
  );
}
