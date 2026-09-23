import { Suspense, useEffect, useRef } from 'react';
import { Demo } from '../registry';
import { hrefFor, navigate } from '../router';

interface FullscreenDemoProps {
  id: string;
  title: string;
}

export function FullscreenDemo({ id, title }: FullscreenDemoProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') navigate(hrefFor(id));
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [id]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-0">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
        <h1 className="font-display text-base text-text-1">{title}</h1>
        <button
          ref={closeRef}
          type="button"
          className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-text-2 transition-colors hover:border-accent hover:text-accent"
          onClick={() => {
            navigate(hrefFor(id));
          }}
        >
          fermer <kbd className="opacity-60">esc</kbd>
        </button>
      </div>

      <div className="min-h-0 flex-1">
        <Suspense fallback={null}>
          <Demo id={id} />
        </Suspense>
      </div>
    </div>
  );
}
