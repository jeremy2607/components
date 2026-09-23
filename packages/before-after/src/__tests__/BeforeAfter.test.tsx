import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BeforeAfter } from '../BeforeAfter';
import type { MismatchReport } from '../core/types';

afterEach(cleanup);

const labels = { slider: 'Comparer avant et après' };

function Paire({ beforeAlt = 'avant', afterAlt = 'après' } = {}) {
  return {
    before: <img src="/avant.jpg" alt={beforeAlt} />,
    after: <img src="/apres.jpg" alt={afterAlt} />,
  };
}

/** jsdom ne décode aucune image : on pose les dimensions naturelles à la main. */
function fakeNaturalSize(alt: string, width: number, height: number): void {
  const image = screen.getByAltText(alt);
  Object.defineProperty(image, 'naturalWidth', { value: width, configurable: true });
  Object.defineProperty(image, 'naturalHeight', { value: height, configurable: true });
  Object.defineProperty(image, 'complete', { value: true, configurable: true });
}

describe('BeforeAfter', () => {
  it('expose un curseur nommé, pas un bloc qu’on traîne', () => {
    render(<BeforeAfter {...Paire()} labels={labels} />);

    const slider = screen.getByRole('slider', { name: 'Comparer avant et après' });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue('50');
  });

  it('annonce ses bornes', () => {
    render(<BeforeAfter {...Paire()} labels={labels} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');
  });

  it('rend les deux couches', () => {
    render(<BeforeAfter {...Paire()} labels={labels} />);

    expect(screen.getByAltText('avant')).toBeInTheDocument();
    expect(screen.getByAltText('après')).toBeInTheDocument();
  });

  it('écrit la position dans une variable CSS, que le rognage lit', () => {
    const { container } = render(<BeforeAfter {...Paire()} labels={labels} defaultPosition={30} />);

    const root = container.querySelector('.ba');
    expect(root?.getAttribute('style')).toContain('--ba-position: 30%');
  });

  it('réserve le cadre avant que les images n’arrivent', () => {
    const { container } = render(<BeforeAfter {...Paire()} labels={labels} aspectRatio={16 / 9} />);

    const root = container.querySelector('.ba');
    expect(root?.getAttribute('style')).toContain('--ba-aspect');
  });

  it('borne une position initiale hors plage', () => {
    const { container } = render(
      <BeforeAfter {...Paire()} labels={labels} defaultPosition={250} />,
    );

    expect(container.querySelector('.ba')?.getAttribute('style')).toContain('--ba-position: 100%');
  });

  it('ne rend aucune légende quand on ne lui en donne pas', () => {
    const { container } = render(<BeforeAfter {...Paire()} labels={labels} />);
    expect(container.querySelector('.ba__caption')).toBeNull();
  });

  it('rend les légendes fournies, et rien de plus', () => {
    render(<BeforeAfter {...Paire()} labels={{ ...labels, before: 'Avant', after: 'Après' }} />);

    expect(screen.getByText('Avant')).toBeInTheDocument();
    expect(screen.getByText('Après')).toBeInTheDocument();
  });

  it('n’annonce un texte de valeur que si on lui en fournit un', () => {
    const { rerender } = render(<BeforeAfter {...Paire()} labels={labels} />);
    expect(screen.getByRole('slider')).not.toHaveAttribute('aria-valuetext');

    rerender(
      <BeforeAfter
        {...Paire()}
        labels={{ ...labels, valueText: (p) => `${p} % du résultat` }}
        position={40}
      />,
    );
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '40 % du résultat');
  });

  it('se laisse piloter de l’extérieur', () => {
    const { container, rerender } = render(
      <BeforeAfter {...Paire()} labels={labels} position={20} />,
    );
    expect(container.querySelector('.ba')?.getAttribute('style')).toContain('--ba-position: 20%');

    rerender(<BeforeAfter {...Paire()} labels={labels} position={80} />);
    expect(container.querySelector('.ba')?.getAttribute('style')).toContain('--ba-position: 80%');
  });

  it('prévient du mouvement sans décider quand la position est pilotée', () => {
    const onPositionChange = vi.fn();
    const { container } = render(
      <BeforeAfter
        {...Paire()}
        labels={labels}
        position={20}
        onPositionChange={onPositionChange}
      />,
    );

    fireEvent.change(screen.getByRole('slider'), { target: { value: '65' } });

    expect(onPositionChange).toHaveBeenCalledWith(65);
    // Piloté : le composant n'a pas bougé tout seul.
    expect(container.querySelector('.ba')?.getAttribute('style')).toContain('--ba-position: 20%');
  });

  it('bouge tout seul quand personne ne le pilote', () => {
    const { container } = render(<BeforeAfter {...Paire()} labels={labels} />);

    fireEvent.change(screen.getByRole('slider'), { target: { value: '65' } });

    expect(container.querySelector('.ba')?.getAttribute('style')).toContain('--ba-position: 65%');
  });

  it('suit un pilotage venu du dehors', () => {
    function Pilote() {
      const [position, setPosition] = useState(10);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setPosition(90);
            }}
          >
            aller à droite
          </button>
          <BeforeAfter {...Paire()} labels={labels} position={position} />
        </>
      );
    }

    const { container } = render(<Pilote />);
    fireEvent.click(screen.getByRole('button'));
    expect(container.querySelector('.ba')?.getAttribute('style')).toContain('--ba-position: 90%');
  });

  it('signale deux images qui ne cadrent pas la même chose', () => {
    const onMismatch = vi.fn();
    const { rerender } = render(
      <BeforeAfter {...Paire()} labels={labels} onMismatch={onMismatch} />,
    );

    fakeNaturalSize('avant', 3000, 2000);
    fakeNaturalSize('après', 2000, 2000);
    // Le montage a déjà regardé des images vides : on refait un passage.
    rerender(<BeforeAfter {...Paire()} labels={labels} onMismatch={vi.fn()} />);
    rerender(<BeforeAfter {...Paire()} labels={labels} onMismatch={onMismatch} />);

    expect(onMismatch).toHaveBeenCalledTimes(1);
    const report = onMismatch.mock.calls[0]?.[0] as MismatchReport;
    expect(report.ratios.before).toBe(1.5);
    expect(report.ratios.after).toBe(1);
  });

  it('se tait quand les deux images se superposent', () => {
    const onMismatch = vi.fn();
    const { rerender } = render(
      <BeforeAfter {...Paire()} labels={labels} onMismatch={onMismatch} />,
    );

    fakeNaturalSize('avant', 3000, 2000);
    fakeNaturalSize('après', 1500, 1000);
    rerender(<BeforeAfter {...Paire()} labels={labels} onMismatch={vi.fn()} />);
    rerender(<BeforeAfter {...Paire()} labels={labels} onMismatch={onMismatch} />);

    expect(onMismatch).not.toHaveBeenCalled();
  });

  it('se tait quand les couches ne sont pas des images', () => {
    const onMismatch = vi.fn();
    render(
      <BeforeAfter
        before={<div>avant</div>}
        after={<div>après</div>}
        labels={labels}
        onMismatch={onMismatch}
      />,
    );

    expect(onMismatch).not.toHaveBeenCalled();
  });

  it('retire ses écouteurs au démontage', () => {
    const { unmount } = render(<BeforeAfter {...Paire()} labels={labels} onMismatch={vi.fn()} />);

    const image = screen.getByAltText('avant');
    const remove = vi.spyOn(image, 'removeEventListener');

    unmount();
    expect(remove).toHaveBeenCalledWith('load', expect.any(Function));
  });
});
