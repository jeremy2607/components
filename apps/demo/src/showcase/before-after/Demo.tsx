import { BeforeAfter, type MismatchReport } from '@jeremyprat/before-after';
import { useCallback, useState } from 'react';
// Dans la démo et non dans `main.tsx` : la feuille du paquet part alors avec
// le morceau paresseux, et la page d'accueil ne la télécharge jamais.
import '@jeremyprat/before-after/styles.css';
import { pieceUrl, type Amenagement } from './piece';
import './demo.css';

/*
 * Un bien livré brut, et trois aménagements possibles du même volume. C'est ce
 * que fait le home staging virtuel : montrer à l'acheteur ce que la pièce peut
 * devenir, sans rien y poser.
 *
 * L'« avant » ne change donc pas d'un onglet à l'autre — c'est la même pièce
 * vide — et c'est l'« après » qui varie.
 */
const AMENAGEMENTS: readonly { id: Amenagement; label: string; legende: string }[] = [
  { id: 'sejour', label: 'Séjour', legende: 'Un volume brut devient un lieu de vie identifiable.' },
  {
    id: 'chambre',
    label: 'Chambre',
    legende: 'Le même volume, en chambre principale sur la baie.',
  },
  { id: 'bureau', label: 'Bureau', legende: 'Et en bureau, pour qui achète pour télétravailler.' },
];

const AVANT = pieceUrl({ staged: false, amenagement: 'sejour' });

function Notice({ report }: { report: MismatchReport }) {
  const ecart = Math.round(report.drift * 100);

  return (
    <p className="ba-demo__notice" role="status">
      <strong>Cadrage incohérent.</strong> L&apos;avant est en {report.before.width}&nbsp;×&nbsp;
      {report.before.height}, l&apos;après en {report.after.width}&nbsp;×&nbsp;{report.after.height}{' '}
      : {ecart}&nbsp;% d&apos;écart de rapport. Les deux couches ne cadrent pas la même chose, et le
      composant le dit plutôt que de recadrer à votre place.
    </p>
  );
}

export function BeforeAfterDemo() {
  const [amenagement, setAmenagement] = useState<Amenagement>('sejour');
  const [deregle, setDeregle] = useState(false);
  const [position, setPosition] = useState(50);
  const [report, setReport] = useState<MismatchReport | null>(null);

  const courant = AMENAGEMENTS.find((entry) => entry.id === amenagement) ?? AMENAGEMENTS[0];

  // Un carré au lieu d'un 3/2 : exactement la photo que l'agence envoie un
  // jour sans y penser, et que rien ne signale à l'oeil.
  const apres = pieceUrl({
    staged: true,
    amenagement,
    ...(deregle ? { width: 600, height: 600 } : {}),
  });

  /*
   * Référence stable : le contrôle de cadrage ne se relance qu'au changement
   * d'images, pas à chaque rendu que provoque le déplacement du curseur.
   */
  const onMismatch = useCallback((next: MismatchReport) => {
    setReport(next);
  }, []);

  return (
    <div className="ba-demo">
      <div className="ba-demo__barre">
        <div className="ba-demo__onglets" role="group" aria-label="Aménagement montré">
          {AMENAGEMENTS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="ba-demo__onglet"
              aria-pressed={entry.id === amenagement}
              onClick={() => {
                setAmenagement(entry.id);
                setReport(null);
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <label className="ba-demo__bascule">
          <input
            type="checkbox"
            checked={deregle}
            onChange={(event) => {
              setDeregle(event.currentTarget.checked);
              setReport(null);
            }}
          />
          Envoyer une photo mal cadrée
        </label>
      </div>

      <BeforeAfter
        // Le `key` force un remontage au changement d'images : c'est ce qui
        // redonne au contrôle de cadrage une paire neuve à mesurer.
        key={`${amenagement}-${String(deregle)}`}
        before={<img src={AVANT} alt="La pièce livrée brute, sans mobilier" />}
        after={
          <img
            src={apres}
            alt={`La même pièce aménagée en ${courant?.label.toLowerCase() ?? ''}`}
          />
        }
        labels={{
          slider: `Comparer avant et après — ${courant?.label ?? ''}`,
          before: 'Avant',
          after: 'Après',
          valueText: (value) => `${value} % de la pièce brute visible`,
        }}
        aspectRatio={3 / 2}
        position={position}
        onPositionChange={setPosition}
        onMismatch={onMismatch}
      />

      <p className="ba-demo__legende">{courant?.legende}</p>

      {report && <Notice report={report} />}

      <p className="ba-demo__aide">
        Le trait est un curseur : cliquez dans l&apos;image, glissez, ou donnez-lui le focus au
        clavier et utilisez les flèches.
      </p>
    </div>
  );
}
