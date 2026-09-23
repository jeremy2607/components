import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
// Animations de regroupement. MarkerCluster.Default.css n'est pas importé :
// c'est l'apparence par défaut du greffon, que status-map remplace.
import 'leaflet.markercluster/dist/MarkerCluster.css';
import '@jeremyprat/status-map/styles.css';
import './styles.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('élément #root introuvable');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
