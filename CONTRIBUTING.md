# Contribuer

## Mise en route

```bash
npm install -g pnpm
pnpm install
pnpm dev
```

`pnpm dev` construit les paquets puis lance la galerie sur
`http://localhost:5173`, avec les paquets en reconstruction continue.

## Vérifications

```bash
pnpm check
```

Enchaîne, dans cet ordre : format, lint, types, tests, builds. Tout doit passer avant un
commit. Les commandes séparées existent aussi : `pnpm format`, `pnpm lint`, `pnpm typecheck`,
`pnpm test`, `pnpm build`.

Quelques règles que l'outillage applique et qu'il vaut mieux connaître :

- TypeScript strict, avec `noUncheckedIndexedAccess` et `verbatimModuleSyntax` ;
- les règles React Compiler d'`eslint-plugin-react-hooks` sont actives, donc écrire une ref
  pendant le rendu est une erreur, pas un avertissement ;
- `console.log` et `debugger` sont des erreurs de lint.

## Tests

Vitest et Testing Library. Ce qu'on attend d'une contribution :

- la logique décidable est testée **hors DOM**, dans `core/` ;
- un comportement Leaflet est testé sur une vraie carte montée en jsdom ;
- tout ce qui crée quelque chose est testé pour le détruire. Le test des cinquante montages
  et démontages vérifie qu'il ne reste ni conteneur, ni `ResizeObserver`, ni minuteur.

jsdom ne met rien en page : une carte y mesure zéro. Les tests qui dépendent d'une taille
utilisent l'aide `giveMapASize`.

## Variables d'environnement

Aucune n'est nécessaire : un clone frais démarre et se déploie sans secret.

`VITE_MAPTILER_KEY` remplace le fond de carte par celui de MapTiler. Sans clé, la
démo prend les tuiles OpenStreetMap et les assombrit par un filtre CSS posé sur la
seule couche de tuiles : pas de clé, pas de quota, et des marqueurs qui gardent
leurs couleurs. Copier `apps/demo/.env.example` vers `apps/demo/.env` pour en
fournir une.

Une clé de tuiles est **publique par nature** : elle part dans le bundle du navigateur. La
protection n'est pas de la cacher, c'est de la restreindre au domaine de la démo dans le
tableau de bord du fournisseur.

`SITE_URL`, au build, sert à émettre les URL canoniques et `og:url` :
`SITE_URL=https://exemple.fr pnpm build`. Sans elle, ces deux balises sont
simplement omises, parce qu'une URL absolue fausse vaut moins que pas d'URL.

## Déploiement statique

```bash
pnpm build
```

L'artefact est dans `apps/demo/dist`. Il est construit en **base absolue** : le site
est servi à la racine d'un domaine ou d'un sous-domaine, pas dans un sous-dossier.

C'est la contrepartie du pré-rendu : chaque composant a son propre
`components/<id>/index.html`, et un chemin d'asset relatif y pointerait à côté.
Pour servir depuis un sous-dossier, il faudrait fixer `base` à ce chemin au
build.

Sur un hébergement Apache ou LiteSpeed, téléverser **le contenu** de `apps/demo/dist` (et
non le dossier lui-même) dans le répertoire servi. Le `.htaccess` fourni active la
compression, garde longtemps les fichiers d'assets, qui portent une empreinte dans leur nom,
et interdit la mise en cache d'`index.html` pour qu'un déploiement soit visible tout de
suite. Sa réécriture vers `index.html` n'est qu'un filet : les URL des composants
sont de vrais fichiers.

## Commits

Messages en français, préfixés par le type et la portée : `feat(status-map):`,
`fix(demo):`, `chore:`. Le corps dit **pourquoi**, pas ce que le diff montre déjà.
