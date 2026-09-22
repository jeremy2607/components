import type { StatusRegistry } from '@jeremyprat/status-map';
import type { SiteStatus } from './data/types';

/*
 * Registre ouvert : ajouter un statut, c'est ajouter une entrée ici. Rien
 * d'autre dans la démo ne connaît la liste des statuts.
 *
 * Les trois glyphes sont volontairement de formes différentes : coche,
 * triangle, disque barré. L'information ne passe jamais par la seule couleur.
 * Ils sont dessinés en encre sombre sur la pastille colorée, ce qui tient le
 * contraste AA sur les trois teintes, y compris l'ambre.
 */
export const statuses: StatusRegistry<SiteStatus> = {
  ok: {
    color: '#1ED760',
    severity: 0,
    label: 'en service',
    icon: (
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  warning: {
    color: '#FFBE4E',
    severity: 1,
    label: 'en alerte',
    icon: (
      <g fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round">
        <path d="M12 4.2L21.2 20H2.8z" />
        <path d="M12 10v4.4" strokeLinecap="round" />
        <path d="M12 17.4h.01" strokeLinecap="round" strokeWidth="2.6" />
      </g>
    ),
  },
  offline: {
    color: '#FF4E5E',
    severity: 2,
    label: 'hors ligne',
    icon: (
      <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="12" cy="12" r="8.2" />
        <path d="M6.6 6.6l10.8 10.8" />
      </g>
    ),
  },
};
