import { catalog, techOf, techUsage } from '../catalog';
import { useGallery } from '../store/useGallery';
import { TECH } from '../tech';
import { ComponentCard } from './ComponentCard';
import { TechChip } from './TechChip';

const usage = techUsage();
const usedTech = TECH.filter((tech) => (usage.get(tech.id)?.length ?? 0) > 0);

export function Home() {
  const techFilter = useGallery((state) => state.techFilter);
  const toggleTech = useGallery((state) => state.toggleTech);

  const shown = techFilter ? catalog.filter((meta) => techOf(meta).includes(techFilter)) : catalog;

  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
          Bibliothèque de composants
        </p>
        {/* TODO Jeremy : ce titre et ce paragraphe sont ta première phrase à un
            recruteur. Garde-les courts, mais mets-y tes mots. */}
        <h1 className="max-w-3xl text-4xl leading-[1.08] text-text-1 sm:text-6xl">
          Des composants React sortis de projets réels, avec le raisonnement qui va avec.
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-relaxed text-text-2">
          Chaque composant est publiable, testé, et documenté par le problème qu&apos;il résout
          plutôt que par la liste de ses props. La démo est le vrai composant, pas une capture.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-8">
        <h2 className="sr-only">Filtrer par techno</h2>
        <ul className="flex flex-wrap gap-1.5">
          {usedTech.map((tech) => (
            <li key={tech.id}>
              <TechChip
                id={tech.id}
                count={usage.get(tech.id)?.length ?? 0}
                active={techFilter === tech.id}
                onClick={() => {
                  toggleTech(tech.id);
                }}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="sr-only">Les composants</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((meta) => (
            <li key={meta.id} className="flex">
              <ComponentCard meta={meta} />
            </li>
          ))}
        </ul>
        {shown.length === 0 && (
          <p className="border border-dashed border-line p-8 text-center text-sm text-text-2">
            Aucun composant n&apos;utilise cette techno pour l&apos;instant.
          </p>
        )}
      </section>
    </>
  );
}
