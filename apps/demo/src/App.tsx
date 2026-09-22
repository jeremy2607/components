import { StatusMap, type ViewConfig } from '@jeremyprat/status-map';
import { tiles } from './tiles';

const view: ViewConfig = { defaultCenter: [46.6, 2.4], defaultZoom: 6 };

export function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">status-map</h1>
        <p className="app__tagline">
          Carte de supervision d'un parc de sites, clustering coloré par sévérité.
        </p>
      </header>
      <main className="app__map">
        <StatusMap items={[]} tiles={tiles} view={view} labels={{ map: 'Carte du parc' }} />
      </main>
    </div>
  );
}
