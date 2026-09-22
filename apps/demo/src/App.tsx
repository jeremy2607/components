import { useState } from 'react';
import {
  StatusMap,
  type ClusterConfig,
  type DataQualityReport,
  type ViewConfig,
} from '@jeremyprat/status-map';
import { DataQualityNotice } from './components/DataQualityNotice';
import { SitePopup } from './components/SitePopup';
import { generateSites } from './data/generateSites';
import type { Site } from './data/types';
import { statuses } from './statuses';
import { tiles } from './tiles';
import { useDismissible } from './useDismissible';

const view: ViewConfig = { defaultCenter: [46.6, 2.4], defaultZoom: 6 };

const cluster: ClusterConfig = {
  maxRadius: 80,
  spiderLegPolylineOptions: { weight: 2, color: '#5e6c84', opacity: 0.35 },
};

// Un seul parc par chargement de page, tiré à l'import : le rendu reste pur.
const sites = generateSites();

const LOCALE = 'fr-FR';

export function App() {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [selected, setSelected] = useState<Site | null>(null);
  const { dismissed, dismiss } = useDismissible('data-quality');

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
              <button type="button" onClick={() => setSelected(null)}>
                Désélectionner
              </button>
            </p>
          )}
          <p className="app__count">{sites.length} sites</p>
        </div>
      </header>

      {report && !dismissed && <DataQualityNotice report={report} onDismiss={dismiss} />}

      <main className="app__map">
        <StatusMap
          items={sites}
          statuses={statuses}
          tiles={tiles}
          view={view}
          cluster={cluster}
          locale={LOCALE}
          onSelect={setSelected}
          renderPopup={(site, context) => (
            <SitePopup site={site} context={context} onOpenDetails={setSelected} />
          )}
          onDataQuality={setReport}
          labels={{
            map: 'Carte du parc',
            marker: (item, status) => `${item.data?.name ?? item.id}, ${status.label ?? ''}`,
            cluster: (count, status) => `${count} sites, dont au moins un ${status.label ?? ''}`,
          }}
        />
      </main>
    </div>
  );
}
