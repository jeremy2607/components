import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@jeremyprat/facet-filter/styles.css';
import './tokens/tokens.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('élément #root introuvable');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
