import { Component, type ErrorInfo, type ReactNode } from 'react';

interface SceneBoundaryProps {
  children: ReactNode;
  /** Appelé une fois quand la scène a échoué : la galerie repasse en 2D. */
  onFail: () => void;
}

/**
 * La barrière qui garantit qu'une scène cassée ne casse que la scène.
 *
 * La 3D est un ornement : la vraie liste des composants est la grille en
 * dessous, dans le DOM. Il n'y a donc aucune raison qu'une erreur du canevas
 * emporte la page — et pourtant c'est ce qui arrivait, parce que React fait
 * remonter une erreur de rendu jusqu'à la racine et démonte tout sur son
 * passage. Un appel à `forceContextLoss` au démontage suffisait à rendre le
 * canevas inutilisable, et la galerie entière devenait blanche.
 *
 * Une barrière d'erreur ne peut être qu'une classe : React n'expose pas
 * `componentDidCatch` aux fonctions.
 */
export class SceneBoundary extends Component<SceneBoundaryProps, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Le repli est la seule réponse utile : la 2D dit la même chose que la 3D,
    // en plus lisible. Reste à le signaler à la galerie.
    this.props.onFail();
    void error;
    void info;
  }

  override render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
