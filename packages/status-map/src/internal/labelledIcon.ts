import * as L from 'leaflet';

export interface LabelledDivIconOptions extends L.DivIconOptions {
  /** Nom accessible, reposé à chaque création de l'élément. */
  label: string;
}

type LabelledIcon = L.DivIcon & { options: LabelledDivIconOptions };

/**
 * DivIcon qui renomme son élément à chaque création.
 *
 * Le regroupement détruit et recrée les éléments d'icône au fil des zooms. Un
 * attribut posé une seule fois après le montage disparaîtrait au premier
 * regroupement ; redéfinir `createIcon` est le seul point qui passe à coup sûr.
 *
 * Seul le nom est posé ici. Leaflet donne lui-même `role="button"` et un
 * `tabindex` aux marqueurs navigables au clavier, après cet appel : écrire un
 * rôle ici ne servirait qu'à se faire écraser.
 */
const LabelledDivIcon = L.DivIcon.extend({
  createIcon(this: LabelledIcon, oldIcon?: HTMLElement): HTMLElement {
    const element = L.DivIcon.prototype.createIcon.call(this, oldIcon);
    element.setAttribute('aria-label', this.options.label);
    return element;
  },
}) as unknown as new (options: LabelledDivIconOptions) => L.DivIcon;

export function createLabelledDivIcon(options: LabelledDivIconOptions): L.DivIcon {
  return new LabelledDivIcon(options);
}
