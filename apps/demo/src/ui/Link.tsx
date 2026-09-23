import type { ReactNode } from 'react';
import { navigate } from '../router';

interface LinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

/**
 * Un vrai `<a>` avec une vraie URL : le clic milieu, le « ouvrir dans un
 * nouvel onglet » et les robots continuent de fonctionner. Seul le clic
 * gauche simple est intercepté.
 */
export function Link({ href, className, children }: LinkProps) {
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        event.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
