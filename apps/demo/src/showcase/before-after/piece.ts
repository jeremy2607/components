/*
 * La pièce de la démo, dessinée plutôt que photographiée.
 *
 * Deux raisons, et aucune n'est l'économie. La première est que les photos du
 * vrai comparateur sont celles de biens de clients : elles n'ont rien à faire
 * dans un dépôt public. La seconde est que la démonstration porte justement sur
 * la superposition — un dessin garantit que les deux états partagent exactement
 * la même géométrie, ce qu'une paire de photos ne garantit jamais.
 *
 * Le résultat est servi en `data:` : ce sont de vraies balises `img`, avec de
 * vraies dimensions naturelles, donc le contrôle de cadrage du paquet
 * travaille pour de bon au lieu d'être simulé.
 */

export type Amenagement = 'sejour' | 'chambre' | 'bureau';

interface Palette {
  plafond: string;
  mur: string;
  sol: string;
  plinthe: string;
  cadre: string;
  ombre: string;
}

/** La pièce livrée brute : béton, plâtre, et rien d'autre. */
const BRUT: Palette = {
  plafond: '#e4e2de',
  mur: '#d9d6d1',
  sol: '#c6c2bb',
  plinthe: '#b9b5ae',
  cadre: '#a9a49c',
  ombre: 'rgba(16,43,71,.07)',
};

/** La même, meublée : sable et noyer, la palette du site. */
const MEUBLE: Palette = {
  plafond: '#faf7f2',
  mur: '#f3ede4',
  sol: '#c9a97f',
  plinthe: '#efe9e0',
  cadre: '#102b47',
  ombre: 'rgba(16,43,71,.13)',
};

const OR = '#b08d57';
const MARINE = '#102b47';

/**
 * La vue par la baie : le même horizon dans les deux états.
 *
 * C'est le repère qui rend la comparaison lisible. Si la vue bougeait d'un
 * côté à l'autre, l'oeil ne saurait plus s'il regarde la même pièce.
 */
/*
 * La baie est à gauche, le mobilier à droite, et ce n'est pas un choix
 * esthétique. Le trait partage l'image en deux : à gauche l'avant, à droite
 * l'après. Un aménagement dessiné à gauche serait donc caché par la pièce
 * brute tant qu'on n'a pas tiré le trait à fond, et la démonstration ne
 * montrerait rien. La baie, elle, appartient aux deux états : c'est le repère
 * qui prouve qu'on regarde bien la même pièce.
 */
function baie(): string {
  return `
    <defs>
      <linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#bcd8e8"/>
        <stop offset="1" stop-color="#eef5f8"/>
      </linearGradient>
    </defs>
    <rect x="70" y="96" width="324" height="296" fill="url(#ciel)"/>
    <path d="M70 300 L180 268 L262 292 L394 262 L394 330 L70 330 Z" fill="#93a894" opacity=".75"/>
    <rect x="70" y="318" width="324" height="74" fill="#7ea7bc"/>
    <rect x="70" y="318" width="324" height="5" fill="#ffffff" opacity=".35"/>
    <rect x="112" y="344" width="60" height="2.5" fill="#ffffff" opacity=".45"/>
    <rect x="256" y="362" width="86" height="2.5" fill="#ffffff" opacity=".35"/>`;
}

/** La coquille : plafond, mur, sol, baie. Identique dans les deux états. */
function coquille(p: Palette): string {
  return `
    <rect width="900" height="600" fill="${p.mur}"/>
    <rect width="900" height="46" fill="${p.plafond}"/>
    <rect y="430" width="900" height="170" fill="${p.sol}"/>
    <rect y="424" width="900" height="8" fill="${p.plinthe}"/>
    ${baie()}
    <rect x="60" y="86" width="344" height="316" fill="none" stroke="${p.cadre}" stroke-width="9"/>
    <rect x="228" y="96" width="8" height="296" fill="${p.cadre}"/>
    <rect x="70" y="238" width="324" height="7" fill="${p.cadre}"/>`;
}

/** Le séjour : canapé, table basse, tapis, plante, toile. */
function sejour(): string {
  return `
    <ellipse cx="600" cy="514" rx="215" ry="40" fill="${MARINE}" opacity=".07"/>
    <rect x="440" y="352" width="308" height="96" rx="12" fill="#5d6f7f"/>
    <rect x="454" y="330" width="130" height="44" rx="10" fill="#6e8191"/>
    <rect x="600" y="330" width="130" height="44" rx="10" fill="#6e8191"/>
    <rect x="456" y="440" width="18" height="30" rx="5" fill="${MARINE}"/>
    <rect x="714" y="440" width="18" height="30" rx="5" fill="${MARINE}"/>
    <ellipse cx="596" cy="492" rx="88" ry="20" fill="#8a6f4e"/>
    <rect x="512" y="476" width="168" height="10" rx="5" fill="#a8895f"/>
    <rect x="536" y="486" width="9" height="26" fill="#8a6f4e"/>
    <rect x="648" y="486" width="9" height="26" fill="#8a6f4e"/>
    <rect x="512" y="152" width="128" height="96" fill="#ffffff"/>
    <rect x="512" y="152" width="128" height="96" fill="none" stroke="${MARINE}" stroke-width="5"/>
    <path d="M528 228 L568 178 L600 218 L624 194 L624 234 L528 234 Z" fill="${OR}" opacity=".55"/>
    <rect x="792" y="446" width="44" height="42" rx="6" fill="#9c6b4a"/>
    <path d="M814 446 C784 414 784 372 814 356 C844 372 844 414 814 446 Z" fill="#4e7f5e"/>
    <path d="M814 440 C844 418 864 392 860 366" stroke="#3f6b4d" stroke-width="7" fill="none"/>`;
}

/** La chambre : lit, chevets, lampes, tapis. */
function chambre(): string {
  return `
    <ellipse cx="606" cy="518" rx="210" ry="38" fill="${MARINE}" opacity=".07"/>
    <rect x="512" y="286" width="196" height="120" rx="8" fill="#6e8191"/>
    <rect x="488" y="392" width="300" height="76" rx="10" fill="#f2efe9"/>
    <rect x="488" y="428" width="300" height="40" rx="8" fill="#5d6f7f"/>
    <rect x="516" y="360" width="76" height="40" rx="10" fill="#ffffff"/>
    <rect x="608" y="360" width="76" height="40" rx="10" fill="#ffffff"/>
    <rect x="496" y="462" width="16" height="26" fill="${MARINE}"/>
    <rect x="766" y="462" width="16" height="26" fill="${MARINE}"/>
    <rect x="424" y="404" width="58" height="62" rx="6" fill="#9c6b4a"/>
    <rect x="794" y="404" width="58" height="62" rx="6" fill="#9c6b4a"/>
    <path d="M436 404 L442 372 L470 372 L476 404 Z" fill="${OR}" opacity=".75"/>
    <path d="M806 404 L812 372 L840 372 L846 404 Z" fill="${OR}" opacity=".75"/>
    <rect x="534" y="170" width="152" height="70" fill="none" stroke="${MARINE}" stroke-width="5"/>`;
}

/** Le bureau : plan de travail, siège, étagère, plante. */
function bureau(): string {
  return `
    <ellipse cx="596" cy="510" rx="192" ry="36" fill="${MARINE}" opacity=".07"/>
    <rect x="450" y="386" width="300" height="14" rx="4" fill="#a8895f"/>
    <rect x="464" y="400" width="12" height="82" fill="#8a6f4e"/>
    <rect x="724" y="400" width="12" height="82" fill="#8a6f4e"/>
    <rect x="542" y="320" width="118" height="70" rx="5" fill="${MARINE}"/>
    <rect x="550" y="328" width="102" height="54" rx="3" fill="#7ea7bc"/>
    <rect x="478" y="366" width="52" height="20" rx="4" fill="#ffffff" opacity=".8"/>
    <rect x="560" y="420" width="84" height="16" rx="8" fill="#5d6f7f"/>
    <rect x="596" y="436" width="12" height="46" fill="${MARINE}"/>
    <rect x="564" y="480" width="76" height="9" rx="4" fill="${MARINE}"/>
    <rect x="466" y="182" width="210" height="10" rx="3" fill="#a8895f"/>
    <rect x="488" y="146" width="22" height="36" fill="${OR}" opacity=".8"/>
    <rect x="516" y="154" width="18" height="28" fill="${MARINE}" opacity=".7"/>
    <rect x="540" y="140" width="24" height="42" fill="#5d6f7f"/>
    <rect x="788" y="430" width="46" height="44" rx="6" fill="#9c6b4a"/>
    <path d="M811 430 C782 400 786 358 814 344 C840 362 838 404 811 430 Z" fill="#4e7f5e"/>`;
}

const AMENAGEMENTS: Readonly<Record<Amenagement, () => string>> = {
  sejour,
  chambre,
  bureau,
};

/**
 * L'état brut : une ampoule au bout d'un fil, et le vide.
 *
 * Les quelques marques sont volontairement du côté droit, là où l'aménagement
 * viendra : tirer le trait vers la droite découvre exactement l'endroit qu'on
 * vient de meubler, et le vide s'y voit d'autant mieux.
 */
function nu(): string {
  return `
    <rect x="596" y="0" width="3" height="96" fill="#8f8b84"/>
    <circle cx="597" cy="108" r="13" fill="#efe7cf"/>
    <circle cx="597" cy="108" r="13" fill="none" stroke="#a49e95" stroke-width="2"/>
    <rect x="470" y="428" width="250" height="3" fill="#b3aea6"/>
    <rect x="742" y="352" width="34" height="46" rx="3" fill="#cfcbc4"/>
    <rect x="508" y="196" width="80" height="58" fill="#cfcbc4" opacity=".55"/>`;
}

export interface PieceOptions {
  staged: boolean;
  amenagement: Amenagement;
  /** Dimensions naturelles de l'image produite. */
  width?: number;
  height?: number;
}

/**
 * Rend la pièce en `data:`.
 *
 * `viewBox` reste à 900×600 quelles que soient les dimensions demandées : c'est
 * ce qui permet de fabriquer, pour la démonstration du contrôle de cadrage, une
 * image au mauvais rapport sans redessiner quoi que ce soit.
 */
export function pieceUrl({ staged, amenagement, width = 900, height = 600 }: PieceOptions): string {
  const palette = staged ? MEUBLE : BRUT;
  const contenu = staged ? AMENAGEMENTS[amenagement]() : nu();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice">${coquille(palette)}${contenu}</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
