import type { StatusRegistry } from '@jeremyprat/status-map';
import type { SiteStatus } from '../data/types';
import type { StatusCounts } from '../filters';

interface StatusCountersProps {
  statuses: StatusRegistry<SiteStatus>;
  counts: StatusCounts;
  active: ReadonlySet<SiteStatus>;
  onToggle: (status: SiteStatus) => void;
}

/** Compteurs cliquables : lire et filtrer sont le même geste. */
export function StatusCounters({ statuses, counts, active, onToggle }: StatusCountersProps) {
  const entries = Object.entries(statuses) as [
    SiteStatus,
    StatusRegistry<SiteStatus>[SiteStatus],
  ][];

  return (
    <ul className="counters">
      {entries.map(([key, definition]) => (
        <li key={key}>
          <button
            type="button"
            className="counter"
            aria-pressed={active.has(key)}
            onClick={() => {
              onToggle(key);
            }}
          >
            <span
              className="counter__dot"
              style={{ background: definition.color }}
              aria-hidden="true"
            />
            <span className="counter__value">{counts[key]}</span>
            <span className="counter__label">{definition.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
