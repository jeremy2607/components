/**
 * Retire les clés à `undefined`.
 *
 * `L.Util.setOptions` parcourt les clés propres sans filtrer : passer
 * `maxZoom: undefined` n'est pas « ne rien passer », c'est écraser le défaut de
 * la classe. Un fond de carte sans zoom maximum déclaré rend alors
 * `map.getMaxZoom()` infini, et le regroupement refuse de démarrer.
 */
export function definedOnly<T extends object>(options: T): T {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as T;
}
