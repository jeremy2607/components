import type * as L from 'leaflet';
import type { StatusDefinition } from '../core/types';
import { sanitizeKey } from './keys';
import { createLabelledDivIcon } from './labelledIcon';

export interface StatusIconOptions {
  statusKey: string;
  definition: StatusDefinition;
  /** Symbole du sprite à instancier, ou null si le statut n'a pas d'icône. */
  symbolId: string | null;
  size: number;
  label: string;
  selected: boolean;
}

/** La couleur finit dans un attribut de style : on la garde inoffensive. */
export function cssValue(value: string): string {
  return value.replace(/["'<>;]/g, '');
}

/**
 * Fabrique unique des icônes de marqueur.
 *
 * Un seul chemin de code pour tous les statuts : ce qui les distingue est une
 * donnée du registre, jamais une fonction de plus. Le glyphe n'est pas redessiné
 * ici, il est instancié depuis le sprite, donc rendu une fois par statut et non
 * une fois par marqueur.
 */
export function createStatusIcon({
  statusKey,
  definition,
  symbolId,
  size,
  label,
  selected,
}: StatusIconOptions): L.DivIcon {
  const glyph = symbolId
    ? `<svg class="sm-marker__glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#${symbolId}"></use></svg>`
    : '';

  const selection = selected ? ' sm-marker--selected' : '';

  return createLabelledDivIcon({
    className: `sm-marker sm-marker--${sanitizeKey(statusKey)}${selection}`,
    html: `<span class="sm-marker__badge" style="--sm-marker-color:${cssValue(definition.color)}">${glyph}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
    label,
  });
}
