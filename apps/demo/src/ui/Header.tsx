import { catalog } from '../catalog';
import { Link } from './Link';
import { ViewToggle } from './ViewToggle';

const live = catalog.filter((entry) => entry.status !== 'planned').length;
const planned = catalog.length - live;

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink-0/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="font-display text-base tracking-tight text-text-1">
          components<span className="text-accent">.</span>
        </Link>
        <div className="flex items-center gap-4">
          <p className="font-mono text-[11px] text-text-2">
            {live} en ligne
            <span aria-hidden="true"> · </span>
            {planned} à venir
          </p>
          <ViewToggle />
        </div>
      </div>
    </header>
  );
}
