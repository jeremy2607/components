import { useMemo, useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FacetChips } from '../FacetChips';
import { useFacetFilter } from '../useFacetFilter';
import type { Facet } from '../core/types';

interface Produit {
  id: string;
  type: string;
}

const facette: Facet<Produit> = {
  id: 'type',
  label: 'Type',
  values: ['livre', 'film'],
  valuesOf: (p) => p.type,
};

const facettes = [facette];
const produits: readonly Produit[] = [
  { id: 'a', type: 'livre' },
  { id: 'b', type: 'livre' },
  { id: 'c', type: 'film' },
];

function Harnais() {
  const [exclu, setExclu] = useState(false);
  const match = useMemo(() => (exclu ? (p: Produit) => p.id !== 'a' : undefined), [exclu]);
  const { items, counts, selection, filtered, toggle, clear } = useFacetFilter({
    items: produits,
    facets: facettes,
    match,
  });

  return (
    <div>
      <FacetChips facet={facette} counts={counts} selection={selection} onToggle={toggle} />
      <p data-testid="resultats">{items.map((item) => item.id).join(',')}</p>
      <p data-testid="filtre">{String(filtered)}</p>
      <button
        type="button"
        onClick={() => {
          setExclu(true);
        }}
      >
        exclure a
      </button>
      <button type="button" onClick={clear}>
        effacer
      </button>
    </div>
  );
}

afterEach(cleanup);

describe('useFacetFilter', () => {
  it('filtre, compte, puis se réinitialise', () => {
    render(<Harnais />);
    const resultats = screen.getByTestId('resultats');

    expect(resultats).toHaveTextContent('a,b,c');
    expect(screen.getByTestId('filtre')).toHaveTextContent('false');

    fireEvent.click(screen.getByRole('button', { name: /film/ }));
    expect(resultats).toHaveTextContent('c');
    expect(screen.getByTestId('filtre')).toHaveTextContent('true');
    // Compte disjonctif : « livre » reste atteignable malgré le filtre sur « film ».
    expect(screen.getByRole('button', { name: /livre/ })).toHaveTextContent('2');

    fireEvent.click(screen.getByRole('button', { name: 'effacer' }));
    expect(resultats).toHaveTextContent('a,b,c');
  });

  it('applique le prédicat aux résultats et aux comptes', () => {
    render(<Harnais />);

    fireEvent.click(screen.getByRole('button', { name: 'exclure a' }));
    expect(screen.getByTestId('resultats')).toHaveTextContent('b,c');
    expect(screen.getByRole('button', { name: /livre/ })).toHaveTextContent('1');
  });
});
