/*
 * Quelles étiquettes afficher quand elles se marchent dessus.
 *
 * Le graphe est en trois dimensions, les étiquettes sont du texte plat posé
 * par-dessus : deux noeuds éloignés en profondeur peuvent se projeter au même
 * endroit à l'écran. Sur un écran large cela n'arrive presque jamais, sur un
 * téléphone tout le temps, et deux noms superposés ne se lisent ni l'un ni
 * l'autre — c'est pire que n'en montrer qu'un.
 *
 * La règle est donc : à recouvrement, le plus important gagne, et le perdant
 * disparaît plutôt que de rendre les deux illisibles.
 *
 * Pur : ni DOM, ni three.js. Des rectangles et des priorités.
 */

export interface LabelBox {
  id: string;
  /** Coin haut-gauche, en pixels, dans le repère du canevas. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Plus grand gagne : le survol passe devant un composant, qui passe devant une techno. */
  priority: number;
  /** Profondeur projetée. À priorité égale, le plus proche de la caméra gagne. */
  depth: number;
}

function overlaps(a: LabelBox, b: LabelBox, gap: number): boolean {
  return (
    a.x < b.x + b.width + gap &&
    a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap &&
    a.y + a.height + gap > b.y
  );
}

/**
 * Rend les identifiants des étiquettes à afficher.
 *
 * Algorithme glouton : on trie par importance décroissante, puis on pose
 * chacune si elle ne touche aucune déjà posée. Ce n'est pas le placement
 * optimal — le problème l'est rarement — mais il est stable, il se calcule en
 * quelques microsecondes pour quelques dizaines d'étiquettes, et il a la seule
 * propriété qui compte ici : la plus importante est toujours posée.
 *
 * `gap` sépare deux étiquettes voisines : sans lui, deux rectangles qui se
 * frôlent passent le test tout en donnant une bouillie de caractères.
 */
export function declutter(boxes: readonly LabelBox[], gap = 4): ReadonlySet<string> {
  const ordre = [...boxes].sort((a, b) => b.priority - a.priority || a.depth - b.depth);
  const posees: LabelBox[] = [];
  const gardees = new Set<string>();

  for (const boite of ordre) {
    if (posees.some((autre) => overlaps(boite, autre, gap))) continue;
    posees.push(boite);
    gardees.add(boite.id);
  }

  return gardees;
}
