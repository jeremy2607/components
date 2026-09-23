const ROWS = [88, 64, 79, 55, 84, 70, 60, 76];

/** Squelette de la liste pendant le chargement, sans saut de mise en page. */
export function PanelSkeleton() {
  return (
    <ul className="skeleton" aria-hidden="true">
      {ROWS.map((width, index) => (
        <li key={index} className="skeleton__row">
          <span className="skeleton__dot" />
          <span className="skeleton__lines">
            <span className="skeleton__line" style={{ width: `${width}%` }} />
            <span className="skeleton__line skeleton__line--short" />
          </span>
        </li>
      ))}
    </ul>
  );
}
