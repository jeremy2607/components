import { Link } from './Link';

export function NotFound() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-32">
      <h1 className="font-display text-4xl text-text-1">Rien ici</h1>
      <p className="mt-4 text-text-2">Ce composant n&apos;existe pas, ou pas encore.</p>
      <p className="mt-8">
        <Link
          href="/"
          className="font-mono text-[12px] text-accent underline-offset-4 hover:underline"
        >
          ← tous les composants
        </Link>
      </p>
    </section>
  );
}
