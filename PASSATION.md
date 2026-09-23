# Passation — session distante du 23 septembre 2026

Ce document s'adresse à la session suivante, locale. Il ne répète pas
`CLAUDE.md`, qui porte déjà tout le durable — étapes, budgets, décisions,
conventions — et qu'une session lit de toute façon au démarrage. Il dit ce que
`CLAUDE.md` ne peut pas dire : ce qui s'est passé pendant cette session, ce qui
a changé d'avis en cours de route, et ce qui reste ouvert.

## Point de départ

`main` et `origin/main` sont sur `d418104`, arbre propre. Quatre commits,
66 fichiers, +5313 lignes.

```
d418104  fix(demo): la galerie devenait blanche en développement
ac57c4d  feat(demo): finitions — a11y, responsive, SEO, et un titre qui mentait
2ce12c5  feat(before-after): comparateur avant / après, tiré de prat-immobilier
a623ffc  feat(demo): le graphe 3D, les strates, et la bascule 2D/3D
```

```bash
git pull && pnpm install && pnpm dev
```

`pnpm install` n'est pas facultatif : la session a ajouté un paquet au
workspace, et pnpm ne crée les liens qu'à l'installation.

---

## Étape 3 — la 3D (`a623ffc`)

Le concept tient. Les noeuds sont les composants **et** les technos : `react` et
`css`, partagés par tout le catalogue, tombent d'eux-mêmes au centre du graphe,
et les technos utilisées une seule fois sont repoussées au bord. Personne ne l'a
codé — c'est la conséquence des masses dans le placement. Au clic, la caméra
plonge et le composant se déplie en plaques, et **la plaque du bas, `core/`,
n'a aucun fil qui en sort**. C'est la démonstration que la galerie promettait.

### Une décision de l'étape 1 a été renversée

`CLAUDE.md` prévoyait `@react-three/fiber` — le `frameloop="demand"` en venait.
Impossible à tenir :

- **R3F 9 exige React 19**, donc une montée de version de tout le dépôt, hors
  sujet à cette étape ;
- **R3F 8 est figé sur React 18**, donc une impasse ;
- et au-delà du blocage, **un réconciliateur n'avait rien à réconcilier** : la
  scène ne change jamais de forme, seulement de couleurs et de matrices.

Donc three.js piloté à la main, et le rendu à la demande écrit plutôt que
déclaré : la boucle s'éteint quand la caméra est arrivée, un
`IntersectionObserver` l'arrête quand le canevas sort du cadre — donc pendant
qu'on lit du code sur une page de composant.

Mesuré : **138,4 ko gzip** pour toute la scène, budget 230.

### Ce qui vaut d'être connu avant d'y toucher

- Le placement est calculé **au build** par un greffon Vite (`virtual:layout`,
  jumeau de `virtual:snippets`), à graine fixe. Module virtuel et non fichier
  commité, pour qu'il ne puisse pas se désynchroniser du catalogue.
- La désignation des noeuds se fait **en espace écran**, pas au lancer de
  rayon : même cible à toutes les distances, au doigt comme à la souris, et le
  `Raycaster` reste hors du paquet.
- La scène est `aria-hidden`. La vraie liste des composants est la grille en
  dessous, dans le DOM, au clavier, pour les robots. **C'est ce qui autorise la
  3D à échouer sans conséquence** — voir le correctif plus bas.

---

## Étape 4 — `before-after` (`2ce12c5`)

Tiré du vrai `BeforeAfter.tsx` de `prat-immobilier`, pas réinventé. Le dépôt a
été cloné et lu pendant la session.

Le composant du site utilisait **déjà** un `input[type=range]` — la bonne
décision, que la plupart des implémentations ratent. Le paquet la garde et la
pousse plus loin.

### Deux choses trouvées dans le code d'origine

1. L'image « après » a `objectFit: "contain"` en style inline alors que
   `site.css` met `cover` sur `.ba img`. Les deux couches ne cadrent donc pas
   tout à fait la même chose. Le paquet impose le même cadrage aux deux.
2. `effects.ts` gère `pointerdown` / `pointermove` / `setPointerCapture` à la
   main, et c'est **nécessaire là-bas** : le pouce fait 48 pixels, or le
   navigateur convertit l'abscisse du pointeur sur la piste diminuée de la
   largeur du pouce, ce qui rend les deux bords inatteignables. En ramenant le
   pouce à 2 pixels et en laissant le gros repère comme simple dessin, toute
   cette gestion d'événement disparaît.

Vérifié au navigateur, pas supposé : clic à 80 % → 80 %, glissement → 25 %,
flèche gauche → 24, `Origine` → 0.

### La démo dessine la pièce

Les photos du vrai comparateur sont celles de biens de clients : elles n'ont
rien à faire dans un dépôt public. Et comme la démonstration porte justement sur
la superposition, un dessin garantit que les deux états partagent exactement la
même géométrie. Les images sont servies en `data:`, donc ce sont de vraies
balises `img` avec de vraies dimensions naturelles, et le contrôle de cadrage du
paquet travaille pour de bon.

---

## Étape 5 — finitions (`ac57c4d`), première passe

| Mesure                      | Accueil | Page composant |
| --------------------------- | ------- | -------------- |
| axe-core, WCAG 2.1 AA       | 0       | 0              |
| Lighthouse accessibilité    | 100     | 100            |
| Lighthouse bonnes pratiques | 100     | 100            |
| Lighthouse SEO              | 100     | 100            |
| Décalage cumulé             | 0       | 0              |

axe-core tourne sur cinq routes et trois contextes — bureau 3D, bureau 2D,
téléphone — soit quinze passages.

### Le défaut que personne ne cherchait

`App` posait les métadonnées de l'accueil **sur toutes les routes**, et la page
d'un composant posait les siennes. React exécutant les effets des enfants avant
ceux du parent, la page posait les bonnes valeurs et `App` les écrasait
aussitôt. Le HTML pré-rendu restait juste, donc rien ne se voyait à l'oeil —
mais dès que React montait, le titre, la description et l'URL canonique de
chaque composant redevenaient ceux de l'accueil, y compris pour les robots qui
exécutent le JavaScript. C'est Lighthouse qui l'a montré : « canonique pointant
vers la racine sur une page qui n'est pas la racine ».

Une seule source désormais, dans `App`, et six tests dans `App.test.tsx` qui
regardent le DOM **après montage** — c'est-à-dire exactement ce que voyaient ces
robots.

### Le reste

- Contraste : le compte d'une puce de facette était à 4,46:1, la touche « esc »
  du plein écran aussi. Atténuer se paie en contraste.
- Deux régions défilables — la liste du filtre, le tableau des props sur écran
  étroit — n'avaient rien de focalisable dedans : personne au clavier ne pouvait
  les atteindre ni les faire défiler.
- `strataPose` cadrait la hauteur de la pile sans jamais sa largeur. Sur un
  écran étroit c'est la largeur qui contraint, et les plaques sortaient du
  cadre. On encadre maintenant la sphère qui contient la pile.
- Les étiquettes se chevauchaient sur téléphone : `declutter`, pur et testé,
  garde la plus importante et efface celle qui la recouvre.
- `sitemap.xml` et `robots.txt` sont **écrits par le pré-rendu**, pas posés dans
  `public/`, parce qu'ils listent les composants. Même raisonnement que pour le
  placement de la scène. Ils ne sortent que si `SITE_URL` est renseignée.

---

## Le correctif (`d418104`) — à lire avant de toucher à la scène

**La galerie était entièrement blanche en développement.** Aucune carte, aucun
titre. Le build de production, lui, fonctionnait.

À l'étape 3, `dispose()` appelait `renderer.forceContextLoss()`, censé rendre le
contexte WebGL tout de suite plutôt que d'attendre le ramasse-miettes. Mais un
canevas dont on a forcé la perte de contexte **n'en obtient plus jamais**. Or
`StrictMode`, actif en développement, monte les effets, les démonte, puis les
remonte sur le même canevas : le second montage recevait `null`, et three levait
`Cannot read properties of null (reading 'precision')`. En production il n'y a
pas de double montage.

Et rien n'arrêtait cette erreur. La 3D est un ornement, et pourtant son échec
emportait la page entière, parce que React fait remonter une erreur de rendu
jusqu'à la racine en démontant tout sur son passage.

Deux lignes de défense désormais : le montage de la scène est enveloppé dans un
`try` qui replie en 2D, et `SceneBoundary` attrape tout le reste.

### La leçon de méthode

**Toutes les vérifications de cette session ont porté sur le site construit,
jamais sur `pnpm dev`.** C'est pour ça que le bug a survécu à trois commits et
à un audit complet. Une session locale n'a pas cette excuse : elle voit le
serveur de développement. S'en servir.

---

## Ce qui reste

Par ordre d'utilité.

1. **Les images par seconde sur une vraie machine.** Seule case de l'étape 5
   impossible à cocher depuis le conteneur distant : il n'a pas de GPU, WebGL y
   passe en rendu logiciel, et le score de performance Lighthouse mesuré là-bas
   (47 sur l'accueil) ne dit rien de ce que verra un visiteur. Cibles :
   60 images par seconde en vue d'ensemble, moins de 60 appels de dessin — il y
   en a quatre, six pendant un dépliage.

2. **Les textes que seul Jeremy peut écrire.** `grep -rn "TODO" apps/demo/src` :
   le titre et le paragraphe de la page d'accueil, les liens du pied de page, et
   le champ `realProject` de `status-map` et `facet-filter`. Celui de
   `before-after` est rempli.

3. **Les trois composants « à venir »** de `catalog.ts` — `virtual-table`,
   `command-palette`, `date-range` — sont des jalons plausibles, pas une feuille
   de route. À remplacer par de vrais prochains composants, ou à supprimer. Le
   dépôt `prat-immobilier` en contient sans doute d'autres qui valent d'être
   sortis, comme `before-after` l'a été.

4. **Le déploiement.** `CONTRIBUTING.md` porte la procédure pas à pas. Rien à
   compiler sur le serveur : c'est un dossier de fichiers. Ne pas oublier
   `SITE_URL`, sans quoi il sort sans canoniques, sans plan du site et sans
   données structurées.

5. **Une dette repérée, mesurée, non traitée.** Le morceau initial est à
   **60,5 ko sur un budget de 70**. Chaque composant ajoute environ 2,5 ko — pas
   son code, qui est paresseux, mais la prose de son `meta.ts` que `catalog.ts`
   embarque alors que seule la page du composant s'en sert. Trois ou quatre
   composants de plus et le budget saute. La parade, quand le jour viendra :
   scinder chaque `meta` en deux, ce que la carte d'accueil affiche et ce que la
   page charge avec sa démo.

---

## État de l'outillage

`pnpm check` passe : format, lint, types, 255 tests, build, pré-rendu.

| Paquet         | Tests |
| -------------- | ----- |
| `status-map`   | 68    |
| `before-after` | 37    |
| `facet-filter` | 21    |
| galerie        | 129   |

Deux ajouts de configuration à connaître : les modules virtuels ont quitté
`vite.config.ts` pour `vite/virtual.ts`, parce que Vitest a sa propre
configuration et qu'un test montant l'application butait sur un
`virtual:snippets` introuvable — les deux configurations chargent maintenant les
mêmes greffons. Et `apps/demo/vitest.setup.ts` bouche `matchMedia`, que jsdom
n'implémente pas et que la détection de palier interroge.
