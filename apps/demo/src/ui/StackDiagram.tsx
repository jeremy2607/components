import type { StackLayer } from '../types';
import { TechChip } from './TechChip';

interface StackDiagramProps {
  layers: readonly StackLayer[];
}

/**
 * Les couches, de la surface vers le fond.
 *
 * Une couche sans techno n'est pas un oubli : c'est la partie du composant qui
 * ne dépend de rien, et c'est en général celle qui contient les décisions.
 */
export function StackDiagram({ layers }: StackDiagramProps) {
  return (
    <div>
      <ol className="border-l border-line">
        {layers.map((layer, index) => (
          <li key={layer.id} className="relative pb-6 pl-5 last:pb-0">
            <span
              aria-hidden="true"
              className={`absolute -left-[4.5px] top-1.5 size-2 rounded-full ${
                layer.tech.length === 0 ? 'bg-accent' : 'bg-line'
              }`}
            />
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-sm text-text-1">{layer.label}</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-text-2/70">
                couche {layers.length - index}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-text-2">{layer.summary}</p>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {layer.tech.length === 0 ? (
                <li className="font-mono text-[11px] text-accent">aucune dépendance</li>
              ) : (
                layer.tech.map((id) => (
                  <li key={id}>
                    <TechChip id={id} />
                  </li>
                ))
              )}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
