import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FacetChips } from '../FacetChips';
import { EMPTY_SELECTION, toggleValue } from '../core/select';
import type { Facet, FacetCounts, FacetSelection } from '../core/types';

interface Produit {
  type: string;
}

const facette: Facet<Produit> = {
  id: 'type',
  label: 'Type',
  values: ['livre', 'film', 'disque'],
  valuesOf: (p) => p.type,
  labelFor: (value) => value.toUpperCase(),
};

const counts: FacetCounts = { type: { livre: 2, film: 0, disque: 1 } };

function Harnais({ initial = EMPTY_SELECTION }: { initial?: FacetSelection }) {
  const [selection, setSelection] = useState(initial);

  return (
    <FacetChips
      facet={facette}
      counts={counts}
      selection={selection}
      onToggle={(facetId, value) => {
        setSelection((current) => toggleValue(current, facetId, value));
      }}
    />
  );
}

afterEach(cleanup);

describe('FacetChips', () => {
  it('affiche le libellé fourni et le compte', () => {
    render(<Harnais />);

    expect(screen.getByRole('button', { name: /LIVRE/ })).toHaveTextContent('2');
    expect(screen.getByRole('group', { name: 'Type' })).toBeInTheDocument();
  });

  it('désactive une valeur à zéro qui n est pas cochée', () => {
    render(<Harnais />);
    expect(screen.getByRole('button', { name: /FILM/ })).toBeDisabled();
  });

  it('laisse décocher une valeur cochée tombée à zéro', () => {
    render(<Harnais initial={{ type: new Set(['film']) }} />);
    expect(screen.getByRole('button', { name: /FILM/ })).toBeEnabled();
  });

  it('bascule à la pression', () => {
    render(<Harnais />);
    const chip = screen.getByRole('button', { name: /LIVRE/ });

    expect(chip).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });

  it('remonte la facette et la valeur', () => {
    const onToggle = vi.fn();
    render(
      <FacetChips
        facet={facette}
        counts={counts}
        selection={EMPTY_SELECTION}
        onToggle={onToggle}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /DISQUE/ }));
    expect(onToggle).toHaveBeenCalledWith('type', 'disque');
  });
});
