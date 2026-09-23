# Contribuer

## Mise en route

```bash
npm install -g pnpm
pnpm install
pnpm dev
```

`pnpm dev` construit le paquet puis lance la démo sur `http://localhost:5173`, avec le
paquet en reconstruction continue.

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

## Fond de carte

La démo affiche des tuiles vectorielles d'[OpenFreeMap](https://openfreemap.org) : données
OpenStreetMap, schéma OpenMapTiles, **aucune clé et aucune inscription**. Un clone frais
démarre et se déploie sans le moindre secret, et il n'y a pas de quota à surveiller.

Le style se change sur une seule ligne dans `apps/demo/src/tiles.ts`.

Deux détails d'intégration à connaître si vous y touchez :

- MapLibre déduit l'URL de son worker de sa propre URL de module. Empaqueté dans le fichier
  de l'application, ce raisonnement pointe dans le vide et la carte reste blanche. Le worker
  est donc importé en `?worker&url`, ce qui le fait empaqueter avec ses dépendances, et son
  URL est donnée à `setWorkerUrl`. Un simple `?url` ne suffit pas : il copie le fichier sans
  suivre ses imports.
- `worker: { format: 'es' }` est nécessaire dans la configuration Vite, parce que MapLibre
  crée son worker en module.

## Déploiement statique

```bash
pnpm build
```

L'artefact est dans `apps/demo/dist`. Il est construit en base relative, donc il fonctionne
à la racine d'un domaine comme dans un sous-dossier, sans reconstruire.

Sur un hébergement Apache ou LiteSpeed, téléverser **le contenu** de `apps/demo/dist` (et
non le dossier lui-même) dans le répertoire servi. Le `.htaccess` fourni active la
compression, garde longtemps les fichiers d'assets, qui portent une empreinte dans leur nom,
et interdit la mise en cache d'`index.html` pour qu'un déploiement soit visible tout de
suite.

## Commits

Messages en français, préfixés par le type et la portée : `feat(status-map):`,
`fix(demo):`, `chore:`. Le corps dit **pourquoi**, pas ce que le diff montre déjà.
