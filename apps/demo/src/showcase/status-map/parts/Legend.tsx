import type { StatusRegistry } from '@jeremyprat/status-map';
import type { SiteStatus } from '../data/types';

interface LegendProps {
  statuses: StatusRegistry<SiteStatus>;
}

/** Explique la seule règle qui ne se devine pas : la couleur d'un regroupement. */
export function Legend({ statuses }: LegendProps) {
  const entries = Object.entries(statuses) as [
    SiteStatus,
    StatusRegistry<SiteStatus>[SiteStatus],
  ][];
  const worst = entries.reduce((a, b) => (b[1].severity > a[1].severity ? b : a));

  return (
    <section className="legend" aria-label="Légende">
      <ul className="legend__list">
        {entries.map(([key, definition]) => (
          <li key={key} className="legend__item">
            <span className="legend__marker" style={{ background: definition.color }}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                {definition.icon}
              </svg>
            </span>
            {definition.label}
          </li>
        ))}
      </ul>
      <p className="legend__rule">
        Un regroupement prend la couleur du pire statut qu&apos;il contient : un seul site{' '}
        <strong>{worst[1].label}</strong> suffit à le faire passer au rouge.
      </p>
    </section>
  );
}
