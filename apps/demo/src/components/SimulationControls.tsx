interface SimulationControlsProps {
  running: boolean;
  changed: number;
  disabled: boolean;
  onToggle: () => void;
  onReset: () => void;
}

export function SimulationControls({
  running,
  changed,
  disabled,
  onToggle,
  onReset,
}: SimulationControlsProps) {
  return (
    <div className="sim">
      <button
        type="button"
        className="sim__toggle"
        aria-pressed={running}
        disabled={disabled}
        onClick={onToggle}
      >
        <span className={running ? 'sim__pulse sim__pulse--on' : 'sim__pulse'} aria-hidden="true" />
        {running ? "Arrêter l'activité" : "Simuler l'activité"}
      </button>

      {changed > 0 && !running && (
        <button type="button" className="sim__reset" onClick={onReset}>
          Réinitialiser
        </button>
      )}

      <p className="sim__state" aria-live="polite">
        {running ? `Simulation en cours, ${changed} sites modifiés` : ''}
      </p>
    </div>
  );
}
