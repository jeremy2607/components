import { SITE_TAGS, type SiteTag } from '../data/types';

interface TagFilterProps {
  active: ReadonlySet<SiteTag>;
  onToggle: (tag: SiteTag) => void;
}

export function TagFilter({ active, onToggle }: TagFilterProps) {
  return (
    <fieldset className="tags">
      <legend className="tags__legend">Étiquettes</legend>
      <ul className="tags__list">
        {SITE_TAGS.map((tag) => (
          <li key={tag}>
            <button
              type="button"
              className="tags__chip"
              aria-pressed={active.has(tag)}
              onClick={() => {
                onToggle(tag);
              }}
            >
              {tag}
            </button>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
