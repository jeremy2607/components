import type { PopupContext } from '@jeremyprat/status-map';
import { formatRelativeTime } from '../../../data/formatRelativeTime';
import type { Site, SiteStatus } from '../../../data/types';

interface SitePopupProps {
  site: Site;
  context: PopupContext<SiteStatus>;
  onOpenDetails: (site: Site) => void;
}

/**
 * Contenu libre, monté par portail : ce bouton est un vrai bouton React, avec
 * son gestionnaire. Un contenu posé en innerHTML ne saurait pas faire ça.
 */
export function SitePopup({ site, context, onOpenDetails }: SitePopupProps) {
  const { status, close, locale } = context;
  const since = formatRelativeTime(site.data.lastContact, locale ?? 'fr-FR');

  return (
    <article className="popup">
      <header className="popup__header">
        <span className="popup__dot" style={{ background: status.color }} aria-hidden="true" />
        <div>
          <h2 className="popup__name">{site.data.name}</h2>
          <p className="popup__model">{site.data.model}</p>
        </div>
      </header>

      <p className="popup__facts">
        {status.label}
        <span aria-hidden="true"> · </span>
        <span className="popup__since">dernier échange {since}</span>
      </p>

      {site.data.tags.length > 0 && (
        <ul className="popup__tags">
          {site.data.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="popup__action"
        onClick={() => {
          close();
          onOpenDetails(site);
        }}
      >
        Voir la fiche
      </button>
    </article>
  );
}
