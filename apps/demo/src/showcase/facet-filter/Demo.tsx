import { useId, useMemo, useState } from 'react';
import { EMPTY_SELECTION, FacetChips, facetCounts, useFacetFilter } from '@jeremyprat/facet-filter';
import './demo.css';
import { SITE_FACETS, STATUS_FACET, TAGS_FACET, searchPredicate } from '../../data/filters';
import { generateSites } from '../../data/generateSites';
import { statuses } from '../../data/statuses';

const parc = generateSites({ count: 120, seed: 7 });
const SHOWN = 40;

export function FacetFilterDemo() {
  const [search, setSearch] = useState('');
  const [naif, setNaif] = useState(false);
  const searchId = useId();

  const match = useMemo(() => searchPredicate(search), [search]);
  const { items, counts, selection, filtered, toggle, clear } = useFacetFilter({
    items: parc,
    facets: SITE_FACETS,
    match,
  });

  /*
   * La version fautive, pour la montrer : compter sur le résultat déjà filtré.
   * Toutes les valeurs non cochées de la facette en cours tombent à zéro, donc
   * se désactivent, et il devient impossible d'élargir sans décocher d'abord.
   */
  const comptesNaifs = useMemo(() => facetCounts(items, SITE_FACETS, EMPTY_SELECTION), [items]);
  const affiches = naif ? comptesNaifs : counts;

  return (
    <div className="ffd">
      <div className="ffd__controls">
        <div className="ffd__field">
          <label className="ffd__label" htmlFor={searchId}>
            Rechercher
          </label>
          <input
            id={searchId}
            className="ffd__input"
            type="search"
            value={search}
            placeholder="Nom ou modèle"
            onChange={(event) => {
              setSearch(event.target.value);
            }}
          />
        </div>

        <FacetChips
          facet={STATUS_FACET}
          counts={affiches}
          selection={selection}
          onToggle={toggle}
        />
        <FacetChips facet={TAGS_FACET} counts={affiches} selection={selection} onToggle={toggle} />

        <label className="ffd__switch">
          <input
            type="checkbox"
            checked={naif}
            onChange={(event) => {
              setNaif(event.target.checked);
            }}
          />
          <span>
            Compter sur le résultat filtré
            <em>la version fautive : cochez un statut pour voir les autres mourir</em>
          </span>
        </label>
      </div>

      <div className="ffd__results">
        <p className="ffd__summary">
          <strong>{items.length}</strong> sur {parc.length}
          {(filtered || match !== undefined) && (
            <button
              type="button"
              className="ffd__reset"
              onClick={() => {
                clear();
                setSearch('');
              }}
            >
              Tout effacer
            </button>
          )}
        </p>

        <ul className="ffd__list">
          {items.slice(0, SHOWN).map((site) => (
            <li key={site.id} className="ffd__item">
              <span
                className="ffd__dot"
                style={{ background: statuses[site.status].color }}
                aria-hidden="true"
              />
              <span className="ffd__name">{site.data.name}</span>
              <span className="ffd__meta">
                {statuses[site.status].label} · {site.data.tags.join(', ') || 'sans étiquette'}
              </span>
            </li>
          ))}
        </ul>

        {items.length > SHOWN && <p className="ffd__more">et {items.length - SHOWN} autres</p>}
        {items.length === 0 && <p className="ffd__more">Aucun site ne correspond.</p>}
      </div>
    </div>
  );
}
