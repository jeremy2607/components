import type { ComponentMeta } from '../../types.ts';

export const meta: ComponentMeta = {
  id: 'before-after',
  packageName: '@jeremyprat/before-after',
  title: 'before-after',
  tagline:
    'Un comparateur avant / après dont le séparateur est un vrai curseur : clavier et lecteurs d’écran compris, sans une ligne de gestion d’événement.',
  status: 'stable',

  problem:
    "Montrer une pièce livrée brute puis la même meublée, c'est une image coupée en deux par un trait qu'on déplace. Tout le monde sait l'écrire en une soirée, et presque toutes les versions écrites en une soirée partagent les deux mêmes défauts. Le premier est qu'un bloc qu'on traîne au `pointermove` n'existe pas pour qui navigue au clavier : pas de rôle, pas de valeur annoncée, rien à mettre au focus. Le second est plus sournois : en rognant la couche du dessus par sa largeur, on redimensionne l'image qu'elle contient, et les deux côtés du trait ne sont plus à la même échelle. La comparaison, dont c'est pourtant l'unique raison d'être, se met à mentir.",

  decisions: [
    {
      title: 'Le séparateur est un `input[type=range]`',
      body: "Posé par-dessus l'image, transparent, de la taille du cadre. Le suivi du pointeur et sa capture pendant le glissement, le clic n'importe où dans l'image, les flèches, Origine, Fin, le rôle `slider` et la valeur annoncée viennent tous du navigateur. Le composant l'habille et lit sa valeur ; il n'écrit aucune gestion d'événement. La meilleure logique d'interaction est celle qu'on n'écrit pas : celle-là est déjà testée par tous les éditeurs de navigateur.",
    },
    {
      title: 'Le pouce natif est ramené à deux pixels',
      body: "C'est le détail qui décide si la décision précédente tient. Le navigateur convertit l'abscisse du pointeur en valeur sur la piste diminuée de la largeur du pouce : un pouce de quarante-huit pixels décale la conversion de vingt-quatre, et les dernières valeurs de chaque bord deviennent inatteignables. Le pouce est donc réduit à presque rien, et le repère large et facile à saisir est un dessin par-dessus.",
    },
    {
      title: 'On rogne, on ne redimensionne pas',
      body: "Le rognage passe par `clip-path`, jamais par une largeur. Donner une largeur à un conteneur dont l'image fait cent pour cent redimensionne l'image : les deux moitiés ne sont plus à la même échelle. Le rognage, lui, laisse l'image à sa taille et n'en cache qu'une partie.",
    },
    {
      title: 'Le paquet ne charge ni ne nomme rien',
      body: "Les deux couches sont des `ReactNode` : une balise `img`, un `picture` avec ses `srcset`, le composant image d'un cadriciel, une vidéo. Le paquet ne connaît ni les URL, ni le chargement paresseux, ni le CDN. Aucune phrase visible n'est embarquée non plus : le nom accessible du curseur et les deux légendes viennent des props, et le rapport du cadre est déclaré, donc la boîte est réservée avant que les photos n'arrivent.",
    },
    {
      title: 'Une comparaison mal cadrée se signale',
      body: "Deux photos de rapports différents ne se superposent pas, et c'est invisible au développeur qui les a bien nommées : le bien n'a simplement plus l'air d'être le même d'un côté à l'autre. Quand les deux couches contiennent une balise `img`, le composant compare leurs dimensions naturelles une fois chargées et prévient par `onMismatch`. Il ne corrige rien : recadrer à la place de l'appelant reviendrait à choisir ce qu'on lui coupe.",
    },
  ],

  realProject: {
    name: 'prat-immobilier.fr',
    context:
      "Le site de l'agence immobilière familiale. Les biens qui passent par un home staging virtuel y montrent chaque pièce livrée brute, puis la même meublée numériquement : quatre comparateurs sur la fiche de la villa des Issambres, quatre sur celle de Cannes. Ce paquet en est la version publiable — mêmes décisions, sans les phrases ni les couleurs du site.",
    url: 'https://www.prat-immobilier.fr',
  },

  layers: [
    {
      id: 'surface',
      label: 'BeforeAfter',
      summary: 'Le cadre, les deux couches, le curseur natif et le repère dessiné.',
      tech: ['react', 'css'],
    },
    {
      id: 'orchestration',
      label: 'useComparison',
      summary: 'Retient la position ou se laisse piloter, et vérifie le cadrage des images.',
      tech: ['react'],
    },
    {
      id: 'core',
      label: 'core/',
      summary: 'Bornage, rapport d’image, écart entre deux cadres. Ni React, ni DOM.',
      tech: [],
    },
  ],

  props: [
    {
      name: 'before',
      type: 'ReactNode',
      required: true,
      summary: 'Couche du dessous, visible à gauche du trait.',
    },
    {
      name: 'after',
      type: 'ReactNode',
      required: true,
      summary: 'Couche du dessus, rognée, visible à droite.',
    },
    {
      name: 'labels',
      type: 'BeforeAfterLabels',
      required: true,
      summary: 'Nom accessible du curseur, légendes, texte de valeur.',
    },
    {
      name: 'aspectRatio',
      type: 'number',
      required: false,
      summary: 'Rapport du cadre, réservé avant le chargement. Défaut : 3/2.',
    },
    {
      name: 'position',
      type: 'number',
      required: false,
      summary: 'Position pilotée, de 0 à 100.',
    },
    {
      name: 'defaultPosition',
      type: 'number',
      required: false,
      summary: 'Position initiale quand elle n’est pas pilotée. Défaut : 50.',
    },
    {
      name: 'onPositionChange',
      type: '(position: number) => void',
      required: false,
      summary: 'Le trait a bougé.',
    },
    {
      name: 'onMismatch',
      type: '(report: MismatchReport) => void',
      required: false,
      summary: 'Les deux couches ne cadrent pas la même chose.',
    },
    {
      name: 'mismatchTolerance',
      type: 'number',
      required: false,
      summary: 'Écart relatif toléré avant de signaler. Défaut : 0,02.',
    },
    {
      name: 'className',
      type: 'string',
      required: false,
      summary: 'Classe ajoutée à la racine.',
    },
  ],

  install: 'pnpm add @jeremyprat/before-after',

  snippet: `import { BeforeAfter } from '@jeremyprat/before-after';
import '@jeremyprat/before-after/styles.css';

export function Staging({ piece }) {
  return (
    <BeforeAfter
      before={<img src={piece.brut} alt={piece.altBrut} />}
      after={<img src={piece.meuble} alt={piece.altMeuble} />}
      labels={{
        slider: \`Comparer avant et après — \${piece.nom}\`,
        before: 'Avant',
        after: 'Après',
        valueText: (value) => \`\${value} % de la pièce brute visible\`,
      }}
      aspectRatio={3 / 2}
      onMismatch={(report) => signaler(piece.id, report)}
    />
  );
}`,

  seo: {
    title: 'before-after — comparateur avant/après React accessible',
    description:
      'Composant React de comparaison avant / après dont le séparateur est un input range natif : clavier, lecteurs d’écran et suivi du pointeur gratuits, rognage par clip-path, et signalement des images mal cadrées.',
  },
};
