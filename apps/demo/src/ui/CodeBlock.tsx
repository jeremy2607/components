import { useEffect, useState } from 'react';
import snippets from 'virtual:snippets';

interface CodeBlockProps {
  id: string;
  code: string;
}

/**
 * Le code est coloré au build par Shiki, pas dans le navigateur : la
 * coloration ne coûte donc aucun octet de JavaScript à l'exécution, et le
 * code est dans le DOM pour les robots comme pour la sélection à la souris.
 */
export function CodeBlock({ id, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const html = snippets[id];

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  return (
    <div className="relative">
      <button
        type="button"
        className="absolute right-3 top-3 z-10 rounded-full border border-line bg-ink-0/80 px-3 py-1 font-mono text-[11px] text-text-2 backdrop-blur transition-colors hover:border-accent hover:text-accent"
        onClick={() => {
          void navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
          });
        }}
      >
        {copied ? 'copié' : 'copier'}
      </button>

      {html ? (
        <div
          className="overflow-x-auto border border-line bg-ink-1 p-5 text-[13px] leading-relaxed [&_pre]:!bg-transparent"
          // Colorisé au build à partir de nos propres sources.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto border border-line bg-ink-1 p-5 text-[13px] leading-relaxed">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
