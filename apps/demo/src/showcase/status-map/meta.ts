import type { ComponentMeta } from '../../types.ts';

export const meta: ComponentMeta = {
  id: 'status-map',
  packageName: '@jeremyprat/status-map',
  title: 'status-map',
  tagline:
    "Carte d'un parc de sites, dont chaque regroupement porte la couleur du pire statut qu'il contient.",
  status: 'stable',

  problem:
    "Superviser un parc, ce n'est pas lire une liste de trois cents lignes : c'est repérer les quelques sites qui ne répondent plus et savoir s'ils sont isolés ou groupés. Une carte le fait mieux qu'un tableau, à une condition : rester lisible quand les marqueurs se chevauchent. Le regroupement résout le chevauchement, mais il masque l'information au moment où elle compte. Un groupe de cinquante sites dont un seul est tombé doit se voir, pas se fondre dans la masse.",

  decisions: [
    {
      title: 'La couleur est une conséquence de la donnée',
      body: "Un regroupement prend la couleur du pire statut qu'il contient. Cette sévérité se lit sur les marqueurs, puis dans le registre de statuts. Aucune couleur n'est déduite d'un nom de classe CSS. Le registre est ouvert : ajouter un statut, c'est ajouter une entrée avec une sévérité, sans toucher au composant.",
    },
    {
      title: 'La sévérité ordonne, elle ne numérote pas',
      body: "Les valeurs peuvent être négatives, décimales ou espacées : seule la comparaison compte. Intercaler un statut « en maintenance » entre « en service » et « en alerte » n'oblige personne à renuméroter.",
    },
    {
      title: 'Tout ce qui peut être pur l’est',
      body: "Quel statut l'emporte dans un groupe, comment cadrer la vue, comment qualifier des coordonnées manquantes : ces décisions sont des fonctions sans effet, testées sans navigateur. Leaflet n'intervient que pour les exécuter.",
    },
    {
      title: 'Les marqueurs sont réconciliés, pas reconstruits',
      body: "Un changement de statut remplace l'icône du marqueur existant, et seuls les groupes touchés sont rafraîchis. Trois cents marqueurs qui bougent ne coûtent donc pas trois cents rendus React : les glyphes sont rendus une fois dans un sprite masqué, puis instanciés par référence.",
    },
    {
      title: 'Le paquet ne parle pas',
      body: "Aucune phrase visible n'est embarquée : les noms accessibles, les libellés de statut et le contenu des bulles viennent tous des props. Le paquet ne navigue pas non plus, il remonte la sélection et laisse l'application décider.",
    },
  ],

  // TODO Jeremy : le vrai projet. Nom (ou nom générique si NDA), contexte en
  // une phrase, lien si public. Mettre `null` si tu préfères ne rien afficher.
  realProject: {
    name: 'TODO — nom du projet',
    context:
      'TODO — une phrase : pour qui, combien de sites, ce que la carte a remplacé, ce qu’elle a changé.',
    url: null,
  },

  layers: [
    {
      id: 'surface',
      label: 'StatusMap',
      summary: "L'emballage prêt à poser : un conteneur, et c'est tout.",
      tech: ['react'],
    },
    {
      id: 'orchestration',
      label: 'useStatusMap',
      summary: 'Monte la carte, les couches et la bulle sans rendre de balisage.',
      tech: ['react'],
    },
    {
      id: 'adaptateur',
      label: 'internal/',
      summary: 'Le dialogue avec Leaflet : icônes, sprite, regroupement, portail de bulle.',
      tech: ['leaflet', 'markercluster', 'css'],
    },
    {
      id: 'core',
      label: 'core/',
      summary: 'Sévérité, cadrage, qualité des données. Ni React, ni DOM, ni Leaflet.',
      tech: [],
    },
  ],

  props: [
    {
      name: 'items',
      type: 'readonly T[]',
      required: true,
      summary: 'Éléments à placer. `lat` et `lng` peuvent manquer.',
    },
    {
      name: 'statuses',
      type: "StatusRegistry<T['status']>",
      required: true,
      summary: 'Couleur, sévérité, glyphe et libellé par statut.',
    },
    {
      name: 'tiles',
      type: 'TileConfig',
      required: true,
      summary: "Fond de carte injecté. Rien n'est codé en dur.",
    },
    {
      name: 'view',
      type: 'ViewConfig',
      required: false,
      summary: 'Centre de repli, zooms, marges de cadrage.',
    },
    {
      name: 'renderPopup',
      type: '(item, ctx) => ReactNode',
      required: false,
      summary: 'Contenu libre, monté par portail. Absent, pas de bulle.',
    },
    {
      name: 'onSelect',
      type: '(item, event) => void',
      required: false,
      summary: 'Clic sur un marqueur. Le composant ne navigue jamais.',
    },
    {
      name: 'selectedId',
      type: 'string | null',
      required: false,
      summary: "Sélection pilotée de l'extérieur.",
    },
    {
      name: 'cluster',
      type: 'ClusterConfig',
      required: false,
      summary: 'Activation, rayon, options du greffon.',
    },
    {
      name: 'labels',
      type: 'StatusMapLabels<T>',
      required: false,
      summary: "Noms accessibles. Le paquet n'embarque aucune prose.",
    },
    {
      name: 'onDataQuality',
      type: '(report) => void',
      required: false,
      summary: 'Éléments sans coordonnées, avec deux niveaux de gravité.',
    },
    {
      name: 'fitOnLoad',
      type: 'boolean',
      required: false,
      summary: 'Cadrage initial sur les éléments. Défaut : vrai.',
    },
  ],

  install: 'pnpm add @jeremyprat/status-map leaflet leaflet.markercluster',

  snippet: `import { StatusMap } from '@jeremyprat/status-map';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import '@jeremyprat/status-map/styles.css';

const statuses = {
  ok: { color: '#1ED760', severity: 0, label: 'en service', icon: <CheckPath /> },
  warning: { color: '#FFBE4E', severity: 1, label: 'en alerte', icon: <AlertPath /> },
  offline: { color: '#FF4E5E', severity: 2, label: 'hors ligne', icon: <OfflinePath /> },
};

export function Parc({ sites }) {
  return (
    <StatusMap
      items={sites}
      statuses={statuses}
      tiles={{ url, attribution, maxZoom: 20 }}
      view={{ defaultCenter: [46.6, 2.4], defaultZoom: 6 }}
      renderPopup={(site) => <SitePopup site={site} />}
      onSelect={(site) => navigate('/sites/' + site.id)}
    />
  );
}`,

  seo: {
    title: 'status-map — carte de supervision React et Leaflet',
    description:
      "Composant React de carte d'un parc de sites, avec regroupement coloré par sévérité de statut : un seul site hors ligne suffit à faire basculer la couleur du groupe.",
  },
};
