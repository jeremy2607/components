import { techOf } from '../catalog';
import { hrefFor } from '../router';
import type { ComponentMeta } from '../types';
import { CodeBlock } from './CodeBlock';
import { DemoFrame } from './DemoFrame';
import { Link } from './Link';
import { PropsTable } from './PropsTable';
import { StackDiagram } from './StackDiagram';
import { TechChip } from './TechChip';
import { useDocumentMeta } from './useDocumentMeta';

interface ComponentPageProps {
  meta: ComponentMeta;
}

export function ComponentPage({ meta }: ComponentPageProps) {
  useDocumentMeta(meta.seo.title, meta.seo.description, hrefFor(meta.id));

  return (
    <article className="mx-auto max-w-6xl px-6 pb-24">
      <nav className="py-6">
        <Link
          href="/"
          className="font-mono text-[11px] text-text-2 underline-offset-4 hover:text-accent hover:underline"
        >
          ← tous les composants
        </Link>
      </nav>

      <header className="border-b border-line pb-10">
        <h1 className="font-display text-4xl text-text-1 sm:text-5xl">{meta.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-text-2">{meta.tagline}</p>

        <ul className="mt-6 flex flex-wrap gap-1.5">
          {techOf(meta).map((id) => (
            <li key={id}>
              <TechChip id={id} />
            </li>
          ))}
        </ul>

        {meta.install && (
          <p className="mt-6 inline-block border border-line bg-ink-1 px-4 py-2 font-mono text-[12px] text-text-2">
            <span className="select-none text-accent">$ </span>
            {meta.install}
          </p>
        )}
      </header>

      <div className="py-10">
        <DemoFrame id={meta.id} title={meta.title} />
      </div>

      <div className="grid gap-12 border-t border-line pt-12 lg:grid-cols-[1fr_20rem]">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl text-text-1">Le problème</h2>
          <p className="mt-4 leading-relaxed text-text-2">{meta.problem}</p>

          <h2 className="mt-12 font-display text-2xl text-text-1">Les décisions</h2>
          <ol className="mt-6 space-y-7">
            {meta.decisions.map((decision, index) => (
              <li key={decision.title}>
                <h3 className="flex gap-3 text-base text-text-1">
                  <span aria-hidden="true" className="font-mono text-sm text-accent">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {decision.title}
                </h3>
                <p className="mt-2 pl-9 leading-relaxed text-text-2">{decision.body}</p>
              </li>
            ))}
          </ol>

          {meta.realProject && (
            <>
              <h2 className="mt-12 font-display text-2xl text-text-1">D&apos;où ça vient</h2>
              <p className="mt-4 leading-relaxed text-text-2">
                <strong className="text-text-1">{meta.realProject.name}</strong>
                <span aria-hidden="true"> — </span>
                {meta.realProject.context}
              </p>
              {meta.realProject.url && (
                <p className="mt-2">
                  <a
                    href={meta.realProject.url}
                    className="font-mono text-[12px] text-accent underline-offset-4 hover:underline"
                  >
                    voir le projet
                  </a>
                </p>
              )}
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="mb-5 font-mono text-[11px] uppercase tracking-widest text-text-2">
            La pile, de la surface au fond
          </h2>
          <StackDiagram layers={meta.layers} />
        </aside>
      </div>

      <section className="border-t border-line pt-12 mt-14">
        <h2 className="font-display text-2xl text-text-1">L&apos;API</h2>
        <div className="mt-6">
          <PropsTable props={meta.props} caption={`Props de ${meta.title}`} />
        </div>
      </section>

      <section className="mt-14 border-t border-line pt-12">
        <h2 className="font-display text-2xl text-text-1">En pratique</h2>
        <div className="mt-6">
          <CodeBlock id={meta.id} code={meta.snippet} />
        </div>
      </section>
    </article>
  );
}
