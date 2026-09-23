import type { DataQualityReport } from '@jeremyprat/status-map';

interface DataQualityNoticeProps {
  report: DataQualityReport;
  onDismiss: () => void;
}

function messageFor(report: DataQualityReport): string {
  if (report.severity === 'error') {
    return "Aucun site n'a de coordonnées. Renseignez-les pour voir le parc s'afficher ici.";
  }

  return report.missing > 1
    ? `${report.missing} sites sans coordonnées ne sont pas affichés sur la carte.`
    : "1 site sans coordonnées n'est pas affiché sur la carte.";
}

/**
 * Rend visible la double gravité du rapport : plus rien à montrer n'appelle pas
 * le même message qu'un parc affiché aux trois quarts.
 */
export function DataQualityNotice({ report, onDismiss }: DataQualityNoticeProps) {
  if (!report.severity) return null;

  return (
    <div
      className={`notice notice--${report.severity}`}
      role={report.severity === 'error' ? 'alert' : 'status'}
    >
      <p className="notice__message">{messageFor(report)}</p>
      <button
        type="button"
        className="notice__dismiss"
        onClick={onDismiss}
        aria-label="Masquer ce message"
      >
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
          <path
            d="M4 4l8 8M12 4l-8 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
