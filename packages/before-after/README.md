# @jeremyprat/before-after

Un comparateur avant / après dont le séparateur est un vrai curseur : clavier et
lecteurs d'écran compris, sans une ligne de gestion d'événement.

## Installation

```bash
pnpm add @jeremyprat/before-after
```

`react` est une dépendance de pair.

## Usage

```tsx
import { BeforeAfter } from '@jeremyprat/before-after';
import '@jeremyprat/before-after/styles.css';

<BeforeAfter
  before={<img src="/sejour-brut.jpg" alt="Séjour livré brut, sans mobilier" />}
  after={<img src="/sejour-meuble.jpg" alt="Le même séjour meublé virtuellement" />}
  labels={{
    slider: 'Comparer avant et après — séjour',
    before: 'Avant',
    after: 'Après',
  }}
  aspectRatio={3 / 2}
/>;
```

## La règle qui compte

Le séparateur **est** un `input[type=range]`, posé par-dessus l'image,
transparent et de la taille du cadre. Le composant l'habille et lit sa valeur ;
il n'écrit aucune gestion d'événement.

C'est la seule décision qui sépare un comparateur utilisable d'une démonstration.
Un bloc qu'on traîne au `pointermove` ne se manipule pas au clavier, n'a pas de
rôle, n'annonce pas sa valeur, et n'existe tout simplement pas pour qui navigue
autrement qu'à la souris. Le curseur natif apporte gratuitement :

- le suivi du pointeur et sa capture pendant le glissement, y compris hors du
  cadre ;
- le clic n'importe où dans l'image, qui amène le trait à cet endroit ;
- les flèches, `Origine`, `Fin`, `Page précédente` et `Page suivante` ;
- le rôle `slider`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` ;
- le focus, et son anneau, reporté sur le repère visible.

La meilleure logique d'interaction est celle qu'on n'écrit pas : celle-là est
déjà testée par tous les éditeurs de navigateur.

Un détail compte quand même. Le navigateur convertit l'abscisse du pointeur en
valeur sur la piste **diminuée de la largeur du pouce** : un pouce de
quarante-huit pixels décale la conversion de vingt-quatre, et les dernières
valeurs deviennent inatteignables. Le pouce natif est donc ramené à deux pixels,
et le repère large et facile à saisir est un dessin par-dessus.

## Les autres décisions

- **On rogne, on ne redimensionne pas.** Le rognage passe par `clip-path`, pas
  par une largeur. Réduire la largeur d'un conteneur dont l'image fait
  `width: 100%` redimensionne l'image : les deux côtés du trait ne sont plus à
  la même échelle, et la comparaison ment.

- **Les deux couches se cadrent de la même façon.** Un `object-fit` différent
  d'un côté et de l'autre suffit à décaler les deux prises de vue de quelques
  pixels, et le sujet n'a plus l'air d'être le même. Le rapport du cadre est
  déclaré par l'appelant, donc la boîte est réservée avant que les photos
  n'arrivent : rien ne saute au chargement.

- **Le paquet ne charge ni ne nomme rien.** Les deux couches sont des
  `ReactNode` : une balise `img`, un `picture` avec ses `srcset`, le composant
  image d'un cadriciel, une `video`. Le paquet ne connaît ni les URL, ni le
  chargement paresseux, ni le CDN. Aucune phrase visible n'est embarquée.

- **Une comparaison mal cadrée se signale.** Deux photos de rapports différents
  ne se superposent pas, et c'est invisible au développeur qui les a bien
  nommées. Quand les deux couches contiennent une balise `img`, le composant
  compare leurs dimensions naturelles une fois chargées et prévient par
  `onMismatch`. Il ne corrige rien : recadrer à la place de l'appelant
  reviendrait à choisir ce qu'on lui coupe.

## API

| Prop                | Type                               | Défaut | Rôle                                                  |
| ------------------- | ---------------------------------- | ------ | ----------------------------------------------------- |
| `before`            | `ReactNode`                        | requis | Couche du dessous, visible à gauche du trait.         |
| `after`             | `ReactNode`                        | requis | Couche du dessus, rognée, visible à droite.           |
| `labels`            | `BeforeAfterLabels`                | requis | Nom accessible du curseur, légendes, texte de valeur. |
| `aspectRatio`       | `number`                           | `1.5`  | Rapport du cadre, réservé avant le chargement.        |
| `position`          | `number`                           | —      | Position pilotée, de 0 à 100.                         |
| `defaultPosition`   | `number`                           | `50`   | Position initiale quand elle n'est pas pilotée.       |
| `onPositionChange`  | `(position: number) => void`       | —      | Le trait a bougé.                                     |
| `onMismatch`        | `(report: MismatchReport) => void` | —      | Les deux couches ne cadrent pas la même chose.        |
| `mismatchTolerance` | `number`                           | `0.02` | Écart relatif toléré avant de signaler.               |
| `className`         | `string`                           | —      | Classe ajoutée à la racine.                           |

`labels.slider` est requis : un curseur sans nom est annoncé « curseur, 50 » et
ne veut rien dire. `labels.before` et `labels.after` sont les légendes visibles ;
absentes, aucune légende n'est rendue. `labels.valueText` alimente
`aria-valuetext` ; absent, seul le pourcentage est annoncé.

## Apparence

Tout passe par des variables CSS, et aucune couleur n'est écrite en dur dans une
règle : les valeurs de repli servent à voir quelque chose dans une page vierge.

```css
.ba {
  --ba-handle: #fff;
  --ba-focus: #b08d57;
  --ba-grip-size: 44px;
  --ba-caption-bg: rgb(10 28 48 / 72%);
  --ba-radius: 4px;
  --ba-fit: cover;
}
```

## D'où il vient

Du comparateur de home staging virtuel de
[prat-immobilier.fr](https://www.prat-immobilier.fr), où l'on montre une pièce
livrée brute puis la même meublée numériquement. Ce paquet en est la version
publiable : mêmes décisions, sans les phrases ni les couleurs du site.

## Licence

MIT
