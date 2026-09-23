import { useRef, type CSSProperties, type ReactNode } from 'react';
import { MAX_POSITION, MIN_POSITION } from './core/position';
import { DEFAULT_TOLERANCE } from './core/ratio';
import type { MismatchReport } from './core/types';
import { useComparison } from './useComparison';
import { useFrameCheck } from './useFrameCheck';

export interface BeforeAfterLabels {
  /**
   * Nom accessible du curseur. Requis : un curseur sans nom est annoncé
   * « curseur, 50 » et ne veut rien dire.
   */
  slider: string;
  /** Légendes visibles. Absentes, aucune légende n'est rendue. */
  before?: string;
  after?: string;
  /** `aria-valuetext`. Absent, le pourcentage seul est annoncé. */
  valueText?: (position: number) => string;
}

export interface BeforeAfterProps {
  /** La couche du dessous, visible à gauche du trait. */
  before: ReactNode;
  /** La couche du dessus, rognée, visible à droite du trait. */
  after: ReactNode;
  labels: BeforeAfterLabels;
  /** Rapport du cadre, réservé avant que les images n'arrivent. Défaut : 3/2. */
  aspectRatio?: number;
  position?: number;
  defaultPosition?: number;
  onPositionChange?: (position: number) => void;
  /** Prévenu quand les deux couches ne cadrent pas la même chose. */
  onMismatch?: (report: MismatchReport) => void;
  /** Écart relatif toléré avant de signaler. Défaut : 0,02. */
  mismatchTolerance?: number;
  className?: string;
}

/**
 * Comparateur avant / après.
 *
 * Trois choses valent d'être dites sur ce qu'il ne fait pas.
 *
 * Il n'écrit aucune gestion d'événement. Le séparateur est un
 * `input[type=range]` posé par-dessus l'image, transparent et de la taille du
 * cadre : le suivi du pointeur, la capture pendant le glissement, les touches
 * fléchées, `Origine`, `Fin`, le rôle `slider` et la valeur annoncée viennent
 * tous du navigateur. Le composant l'habille et lit sa valeur.
 *
 * Il ne redimensionne jamais une couche. Le rognage passe par `clip-path`, pas
 * par une largeur : réduire la largeur d'un conteneur dont l'image fait
 * `width: 100%` redimensionnerait l'image, et les deux côtés du trait ne
 * seraient plus à la même échelle. La comparaison mentirait.
 *
 * Il ne charge ni ne nomme rien. Les deux couches sont des `ReactNode` — une
 * balise `img`, un `picture` avec ses `srcset`, le composant image d'un
 * cadriciel — et toutes les phrases visibles viennent des props.
 */
export function BeforeAfter({
  before,
  after,
  labels,
  aspectRatio = 3 / 2,
  position,
  defaultPosition,
  onPositionChange,
  onMismatch,
  mismatchTolerance = DEFAULT_TOLERANCE,
  className,
}: BeforeAfterProps) {
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);

  const comparison = useComparison({ position, defaultPosition, onPositionChange });
  useFrameCheck(beforeRef, afterRef, onMismatch, mismatchTolerance);

  const rounded = Math.round(comparison.position);

  return (
    <div
      className={className ? `ba ${className}` : 'ba'}
      style={
        {
          '--ba-position': `${comparison.position}%`,
          '--ba-aspect': String(aspectRatio),
        } as CSSProperties
      }
    >
      <div className="ba__layer" ref={beforeRef}>
        {before}
      </div>
      <div className="ba__layer ba__layer--after" ref={afterRef}>
        {after}
      </div>

      {labels.before !== undefined && (
        <span className="ba__caption ba__caption--before">{labels.before}</span>
      )}
      {labels.after !== undefined && (
        <span className="ba__caption ba__caption--after">{labels.after}</span>
      )}

      {/*
       * Le champ est au-dessus de tout, transparent, et couvre le cadre : on
       * peut saisir le trait, mais aussi cliquer n'importe où dans l'image
       * pour l'y amener. C'est le comportement natif d'un curseur, pas une
       * reconstitution.
       */}
      <input
        className="ba__range"
        type="range"
        min={MIN_POSITION}
        max={MAX_POSITION}
        value={comparison.position}
        aria-label={labels.slider}
        aria-valuetext={labels.valueText?.(rounded)}
        onChange={(event) => {
          comparison.move(event.currentTarget.value);
        }}
      />

      <span className="ba__handle" aria-hidden="true">
        <span className="ba__grip">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M7 3 3 9l4 6M11 3l4 6-4 6" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </span>
      </span>
    </div>
  );
}
