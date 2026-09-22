/**
 * Rend une clé de statut utilisable dans un nom de classe.
 *
 * Les clés viennent du consommateur et peuvent contenir n'importe quoi ;
 * les classes produites, elles, doivent rester ciblables en CSS.
 */
export function sanitizeKey(key: string): string {
  return key.replace(/[^\w-]+/g, '-').toLowerCase();
}
