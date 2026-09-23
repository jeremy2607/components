import { techOf } from '../catalog';
import { hrefFor } from '../router';
import type { ComponentMeta } from '../types';
import { Link } from './Link';
import { TechChip } from './TechChip';

interface ComponentCardProps {
  meta: ComponentMeta;
}

export function ComponentCard({ meta }: ComponentCardProps) {
  const planned = meta.status === 'planned';

  return (
    <article
      className={[
        'group relative flex w-full flex-col gap-4 border p-6 transition-colors',
        planned
          ? 'border-dashed border-line-soft bg-transparent'
          : 'border-line bg-ink-1 hover:border-accent/60 group-focus-within:border-accent',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-display text-xl text-text-1">
          {planned ? (
            meta.title
          ) : (
            /*
             * Le lien couvre la carte : un seul arrêt de tabulation par
             * composant. L'anneau de focus reste sur le titre, et la bordure
             * de la carte s'allume avec : la couleur seule ne suffirait pas.
             */
            <Link
              href={hrefFor(meta.id)}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {meta.title}
            </Link>
          )}
        </h2>
        {planned && (
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-text-2">
            à venir
          </span>
        )}
      </div>

      <p className={`text-sm leading-relaxed ${planned ? 'text-text-2/70' : 'text-text-2'}`}>
        {meta.tagline}
      </p>

      <ul className="mt-auto flex flex-wrap gap-1.5 pt-2">
        {techOf(meta).map((id) => (
          <li key={id}>
            <TechChip id={id} />
          </li>
        ))}
      </ul>
    </article>
  );
}
