import type { StatusRegistry } from '../core/types';

interface IconSpriteProps<K extends string> {
  statuses: StatusRegistry<K>;
  symbolIds: Readonly<Record<K, string>>;
}

/**
 * Rend chaque icône du registre une seule fois, dans un sprite masqué.
 *
 * Les marqueurs n'en portent qu'une référence `<use>`. Trois rendus React pour
 * trois cents marqueurs, aucune requête réseau, et le regroupement peut
 * détruire puis recréer les éléments d'icône sans rien coûter.
 */
export function IconSprite<K extends string>({ statuses, symbolIds }: IconSpriteProps<K>) {
  const entries = Object.entries(statuses) as [K, StatusRegistry<K>[K]][];

  return (
    <svg className="sm-sprite" aria-hidden="true" focusable="false">
      <defs>
        {entries.map(([key, definition]) =>
          definition.icon ? (
            <symbol key={key} id={symbolIds[key]} viewBox="0 0 24 24">
              {definition.icon}
            </symbol>
          ) : null,
        )}
      </defs>
    </svg>
  );
}
