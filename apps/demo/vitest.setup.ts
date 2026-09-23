/*
 * jsdom n'implémente pas `matchMedia`, que la détection de palier interroge
 * pour `prefers-reduced-motion` et `pointer: coarse`.
 *
 * Le bouchon répond « non » à tout : c'est la machine la plus neutre possible,
 * celle qui ne demande ni moins de mouvement ni pointeur grossier. Un test qui
 * veut l'inverse redéfinit `matchMedia` pour lui-même — mieux vaut un défaut
 * explicite ici qu'un `?.` défensif dans du code de production, où la fonction
 * existe toujours.
 */
window.matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  addListener: () => undefined,
  removeListener: () => undefined,
  dispatchEvent: () => false,
});
