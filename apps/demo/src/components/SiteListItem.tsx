import { useEffect, useRef } from 'react';
import type { StatusDefinition } from '@jeremyprat/status-map';
import { formatRelativeTime } from '../formatRelativeTime';
import type { Site } from '../data/types';

interface SiteListItemProps {
  site: Site;
  definition: StatusDefinition;
  selected: boolean;
  locale: string;
  onSelect: (site: Site) => void;
}

export function SiteListItem({ site, definition, selected, locale, onSelect }: SiteListItemProps) {
  const ref = useRef<HTMLButtonElement | null>(null);

  // La sélection peut venir de la carte : la liste doit suivre.
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  return (
    <li>
      <button
        ref={ref}
        type="button"
        className="site"
        aria-current={selected ? 'true' : undefined}
        onClick={() => {
          onSelect(site);
        }}
      >
        <span className="site__dot" style={{ background: definition.color }} aria-hidden="true" />
        <span className="site__body">
          <span className="site__name">{site.data.name}</span>
          <span className="site__meta">
            {definition.label} · {formatRelativeTime(site.data.lastContact, locale)}
          </span>
        </span>
      </button>
    </li>
  );
}
