# CLAUDE.md

Contexte de travail pour ce dépôt. À lire avant de toucher au code.

## Le projet

Une bibliothèque de composants React publiables, et une galerie qui les met en
scène. La galerie doit faire deux choses à la fois : impressionner en cinq
secondes, et donner du concret tout de suite après (démo live du vrai
composant, API, décisions techniques, code copiable).

Deux publics : un recruteur qui juge en trente secondes, un développeur qui
veut savoir comment c'est fait.

## Où en est le chantier

| Étape                                                            | État     |
| ---------------------------------------------------------------- | -------- |
| 1. Concept, direction artistique, architecture, budget de perf   | validée  |
| 2. Fondations : galerie 2D, jetons, registre, routage, pré-rendu | faite    |
| 3. 3D : scène, graphe, strates, transitions, bascule 2D/3D       | faite    |
| 4. Composants : les suivants, un par un                          | en cours |
| 5. Finitions : perf mesurée, a11y, responsive, SEO, déploiement  | à faire  |

Travail par étapes, avec validation de Jeremy entre chacune. À la fin de
chaque étape : `pnpm check`, puis un commit.

## Le concept 3D retenu (étape 3)

**Graphe au macro, strates au micro.**

- **Macro** : un graphe dont les noeuds sont les composants _et_ les technos.
  Les technos partagées deviennent des carrefours. La stack n'est pas décorée
  autour de la scène, elle _est_ la scène.
- **Micro** : au clic, la caméra plonge et le noeud se déplie en couches
  horizontales, celles de `meta.layers`. Les arêtes vers les technos partent de
  la couche où la techno intervient vraiment, donc **la couche du bas n'a aucun
  fil qui en sort** : la 3D démontre que le coeur est pur, sans qu'on lise une
  ligne de documentation.

Ce qui a été fait, et comment :

- **Layout calculé au build**, graine fixe, coordonnées livrées en JSON par le
  greffon `virtual:layout`, jumeau de `virtual:snippets`. Zéro simulation de
  forces à l'exécution, et des positions déterministes, sans quoi un lien
  profond ne saurait pas où poser la caméra. Module virtuel plutôt que fichier
  commité : il ne peut pas se désynchroniser du catalogue.
- Un `InstancedMesh` pour tous les noeuds, un `LineSegments` pour toutes les
  arêtes : deux appels de dessin pour tout le graphe, plus deux nuages de
  points additifs (halos, poussière) et deux objets pendant un dépliage.
- **three.js piloté à la main, sans `@react-three/fiber`.** La décision a
  changé en cours d'étape, pour trois raisons : R3F 9 exige React 19, donc une
  montée de version de tout le dépôt hors sujet ici ; R3F 8 est figé sur React
  18 ; et un réconciliateur n'avait rien à réconcilier, la scène ne changeant
  jamais de forme, seulement de couleurs et de matrices. Le rendu à la demande
  promis par `frameloop="demand"` est écrit à la main : la boucle s'éteint
  quand la caméra est arrivée, et un `IntersectionObserver` l'arrête dès que le
  canevas sort du cadre — donc pendant qu'on lit du code sur une page.
- Pas d'ombres temps réel, et pas de `postprocessing` : non mesuré, et les
  halos en points additifs suffisent au rendu « phosphore ».
- Désignation des noeuds en espace écran, pas au lancer de rayon : la même
  cible à toutes les distances, au doigt comme à la souris, et le `Raycaster`
  hors du paquet.
- Quatre paliers : haut, moyen, mobile, 2D. Le mode 2D s'impose sans WebGL,
  avec `prefers-reduced-motion`, ou sur perte de contexte.
- La scène est masquée aux technologies d'assistance : la grille sous le
  canevas reste la vraie liste des composants, dans le DOM, au clavier et pour
  les robots.

## Direction artistique : encre et phosphore

Sombre, froid, un seul accent. Pas de verre dépoli, pas de dégradé violet, pas
de carte arrondie partout. L'élégance vient du vide et d'une typo display très
grande, pas des effets.

Les couleurs vivent **uniquement** dans `apps/demo/src/tokens/tokens.css`.
Tailwind les lit via `@theme`, les feuilles des démos via les noms de rôle
(`--bg`, `--surface`, `--text`, `--muted`, `--border`, `--select-*`, `--focus`),
et la scène 3D les lit au démarrage plutôt que de les redéclarer.

| Rôle    | Valeur                                  |
| ------- | --------------------------------------- |
| fond    | `#06080D` (le vide 3D)                  |
| surface | `#0B0F16`, élévation `#121823`          |
| filets  | `#1C2432`                               |
| texte   | `#EAF0F7`, secondaire `#9AA9BD` (7.7:1) |
| accent  | `#3DF5C5` (14:1 sur le fond)            |

L'accent ne sert qu'à trois choses : le noeud ou l'élément actif, le focus
clavier, l'action primaire. Il est volontairement hors de la famille vert /
ambre / rouge des statuts de la carte, pour qu'aucune couleur de l'interface ne
se lise comme une alerte.

Typographies auto-hébergées dans `apps/demo/public/fonts`, sous-ensemble latin :
**Clash Display 600** (titres), **Switzer 400/500** (texte), **JetBrains Mono**
(code et étiquettes). Les deux premières sont préchargées.

## Architecture

```
packages/<nom>/          un composant publiable, indépendant de la galerie
  src/core/              pur : ni React, ni DOM, ni bibliothèque tierce
  src/                   hooks, composants, styles
apps/demo/               LA galerie, seule application du dépôt
  src/tokens/            jetons, source unique des couleurs
  src/catalog.ts         la liste centrale (données pures, lisible par Node)
  src/tech.ts            le registre des technos (les noeuds partagés)
  src/registry.tsx       les démos, en import paresseux
  src/router.ts          routeur maison, deux motifs
  src/store/             zustand
  src/ui/                l'interface 2D
  src/scene/             la 3D : graphe, layout, paliers, caméra, rendu
  src/data/              le parc fictif, partagé par les démos
  src/showcase/<id>/     meta.ts + Demo.tsx + demo.css d'un composant
  scripts/prerender.ts   un vrai fichier HTML par composant, après le build
```

Règles qui tiennent l'ensemble :

- **Un paquet ignore la galerie.** Aucune métadonnée de galerie, aucun Tailwind,
  aucune prose visible : tout passe par des props.
- **La galerie consomme les paquets par leur `dist`**, jamais par leurs sources.
  Une carte d'exports cassée casse le build avant la publication.
- **Ajouter un composant** : un dossier sous `packages/`, un `meta.ts` dans
  `src/showcase/<id>/`, une entrée dans `catalog.ts`, une ligne dans
  `registry.tsx`. Rien d'autre.
- **`catalog.ts` et les `meta.ts` sont lisibles par Node** (données pures,
  extensions `.ts` explicites sur les imports de valeur). Les scripts de build
  les lisent directement.
- **Le composant actif est dans l'URL**, pas dans le store. Le plein écran
  d'une démo aussi (`?demo=plein`) : il se partage, et le bouton retour en sort.
- **Une démo, deux contenants** : intégrée dans la page par défaut, plein écran
  sur demande. Le composant de démo ne sait pas dans lequel il est ; ce qui doit
  céder quand la place manque le fait par requête de conteneur.
- **Shiki tourne au build**, dans un greffon Vite qui sert `virtual:snippets`.
  Le navigateur ne reçoit que du HTML déjà coloré : zéro octet de JavaScript de
  coloration, et du code lisible par les robots.
- **Base absolue** (`base: '/'`) : le site est servi à la racine d'un domaine ou
  d'un sous-domaine, et chaque composant a son fichier HTML pré-rendu.

## Budget de perf

Mesuré au dernier build, en gzip :

| Morceau                         | Mesure   | Budget | Quand                    |
| ------------------------------- | -------- | ------ | ------------------------ |
| initial (React, shell, catalog) | 60,5 ko  | 70 ko  | toujours                 |
| CSS initial                     | 5,6 ko   | 12 ko  | toujours                 |
| fontes préchargées              | 51,5 ko  | 60 ko  | toujours                 |
| démo status-map (JS + CSS)      | 68,3 ko  | 75 ko  | ouverture de la carte    |
| démo facet-filter (JS + CSS)    | 4,6 ko   | 10 ko  | ouverture du filtre      |
| démo before-after (JS + CSS)    | 4,3 ko   | 10 ko  | ouverture du comparateur |
| scène 3D (three + graphe)       | 138,4 ko | 230 ko | après le premier rendu   |

Règle de dépendance, dans l'esprit du commit `ac46263` : **aucune dépendance
d'exécution de plus de 10 ko gzip n'entre sans une ligne de justification dans
le message de commit.**

**Le coût initial croît avec le catalogue.** `before-after` a ajouté 2,5 ko :
pas son code, qui est paresseux, mais la prose de son `meta.ts` — problème,
décisions, API, extrait — que `catalog.ts` embarque dans le morceau initial
alors que seule la page du composant s'en sert. Trois ou quatre composants de
plus et le budget saute. Le jour venu, la parade est de scinder chaque `meta`
en deux : ce que la carte d'accueil affiche, et ce que la page charge en même
temps que sa démo.

Par frame : moins de 60 appels de dessin en vue d'ensemble — il y en a quatre,
six pendant un dépliage — DPR adaptatif de 1 à 1,75, pas d'ombres. Les images
par seconde restent à mesurer sur une vraie machine, à l'étape 5.

## Conventions de code

Celles du dépôt, appliquées par l'outillage :

- TypeScript strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` ;
- règles du compilateur React actives : écrire une ref pendant le rendu est une
  erreur, fabriquer un composant pendant le rendu aussi ;
- `console.log` et `debugger` sont des erreurs de lint, sauf dans
  `apps/*/scripts/` ;
- la logique décidable est pure et testée hors DOM, dans `core/` ;
- tout ce qui crée quelque chose est testé pour le détruire ;
- commentaires et documentation en français, et un commentaire dit **pourquoi**,
  pas ce que le code montre déjà ;
- commits en français, préfixés `feat(portée):`, `fix:`, `docs:`, `chore:`.

## Commandes

```bash
pnpm dev         # construit les paquets, puis la galerie sur localhost:5173
pnpm check       # format, lint, types, tests, build. À passer avant tout commit.
pnpm build       # paquets + galerie + pré-rendu, artefact dans apps/demo/dist
pnpm typecheck
pnpm lint
pnpm test
```

Déploiement : `SITE_URL=https://exemple.fr pnpm build`, puis téléverser le
**contenu** de `apps/demo/dist` à la racine servie. `SITE_URL` n'est utile que
pour émettre les URL canoniques et `og:url`.

## Ce que Jeremy doit écrire

Les textes qui ne peuvent venir que de lui sont marqués dans le code :

```bash
grep -rn "TODO" apps/demo/src
```

Aujourd'hui : le titre et le paragraphe de la page d'accueil, les liens du pied
de page, et le champ `realProject` de chaque `meta.ts` (le vrai projet d'où
vient le composant). Les trois composants « à venir » de `catalog.ts` sont des
jalons plausibles, pas sa feuille de route : à remplacer ou à supprimer.
