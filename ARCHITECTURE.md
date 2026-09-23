# Architecture

## Les couches

```
packages/status-map/src/
├─ core/          pur : ni React, ni DOM, ni Leaflet à l'exécution
│  ├─ types.ts        le contrat public
│  ├─ severity.ts     resolveWorstStatus
│  ├─ view.ts         computeView, isLocated
│  └─ dataQuality.ts  analyzeDataQuality
├─ internal/      les hooks et fabriques qui parlent à Leaflet
├─ useStatusMap   l'orchestration, sans rendu de conteneur
└─ StatusMap      l'emballage prêt à l'emploi
```

La règle qui tient l'ensemble : **tout ce qui peut être pur l'est**. Les décisions qui
comptent (quel statut l'emporte dans un groupe, comment cadrer, comment qualifier des
coordonnées manquantes) sont des fonctions sans effet, testées sans navigateur. Leaflet
n'intervient que pour exécuter ces décisions.

`useStatusMap` ne rend rien. Il retourne une ref de conteneur, l'instance Leaflet, le
sprite d'icônes et le portail de la bulle. `StatusMap` se contente de les poser dans un
`div`. Qui veut un autre balisage utilise le hook.

## Les pièges déjà résolus

À lire avant de toucher aux hooks internes : chacun de ces points a coûté un bug.

**L'instance Leaflet ne se capture pas dans une fermeture.** Les effets dépendants lisent
l'instance vivante dans une ref et se calent sur le conteneur. Un rejeu d'effets
(StrictMode, rechargement à chaud) relancerait sinon un effet dont la carte vient d'être
détruite, et Leaflet échoue dans `getPane()`.

**Les refs ne s'écrivent pas pendant le rendu.** `useLatest` fait l'écriture dans un effet
de mise en page. Écrire une ref pendant le rendu casse le rendu concurrent, et les règles
du React Compiler le refusent.

**`L.Util.setOptions` n'ignore pas les clés à `undefined`, il les affecte.** Passer
`maxZoom: undefined` écrase le défaut de la classe. `definedOnly` filtre, et le type est
passé explicitement pour qu'une option mal orthographiée soit une erreur de compilation.

**Le nom accessible se pose dans `createIcon`.** Le regroupement détruit et recrée les
éléments d'icône au fil des zooms : un attribut posé après le montage disparaît.

**Le greffon markercluster augmente un `L` global**, pas l'objet importé. Leaflet 1.9 ne
publie que du CommonJS, et un empaqueteur fabrique pour `import * as L` une copie de ses
exports. `resolveClusterFactory` lit donc là où le greffon a réellement écrit. Sans ça, le
regroupement marche en développement et casse en production.

**Les marqueurs sont réconciliés, pas reconstruits.** Un changement de statut remplace
l'icône du marqueur existant, et `refreshClusters` n'est appelé que sur les groupes
touchés : les icônes de regroupement ne se recalculent pas d'elles-mêmes.

## Ajouter un statut

Un statut est une entrée du registre. Rien d'autre ne le connaît.

```tsx
const statuses: StatusRegistry<'ok' | 'warning' | 'offline' | 'maintenance'> = {
  ...existants,
  maintenance: {
    color: '#5B8DEF',
    severity: 0.5,
    label: 'en maintenance',
    icon: <path d="…" fill="none" stroke="currentColor" strokeWidth="2.4" />,
  },
};
```

Trois points à respecter :

- **`severity` ordonne, il ne numérote pas.** Les valeurs peuvent être négatives, décimales
  ou espacées : seule la comparaison compte. Une sévérité intercalaire n'oblige à renuméroter
  personne.
- **`icon` est du contenu SVG dans une boîte de 24 par 24**, pas un `<svg>` complet. Il est
  rendu une seule fois par statut dans un sprite masqué, puis instancié par référence sur
  chaque marqueur. Trois cents marqueurs coûtent donc trois rendus React.
- **Le glyphe doit se distinguer sans la couleur.** Une coche, un triangle et un disque barré
  restent discernables en niveaux de gris ; trois ronds de teintes différentes, non.

Le CSS suit tout seul : la classe produite est `sm-marker--maintenance`, et la couleur passe
par une variable posée sur l'élément. Rien à ajouter dans la feuille du paquet.

## Ajouter un composant à la bibliothèque

Le dépôt est un espace de travail pnpm. Un nouveau composant est un dossier sous
`packages/`, avec le même contrat que `status-map` :

- entrées `.` et `./styles.css`, build ESM, CJS et types ;
- `sideEffects` limité aux feuilles de style ;
- les dépendances lourdes en `peerDependencies`, jamais embarquées ;
- aucune chaîne de texte visible dans le paquet : tout passe par des props ;
- la logique décidable extraite dans un dossier `core/` pur.

`apps/demo` consomme les paquets par leur `dist`, pas par leurs sources : une carte
d'exports cassée casse le build de la démo avant la publication.
