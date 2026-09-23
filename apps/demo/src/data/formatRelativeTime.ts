const UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 30],
  ['month', 12],
  ['year', Number.POSITIVE_INFINITY],
];

/**
 * Durée écoulée en toutes lettres, dans la langue demandée.
 *
 * Descend la cascade des unités jusqu'à celle qui reste lisible : quarante
 * secondes plutôt que zéro minute, trois jours plutôt que soixante-douze heures.
 */
export function formatRelativeTime(iso: string, locale: string, now = Date.now()): string {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  let amount = Math.round((Date.parse(iso) - now) / 1000);

  for (const [unit, limit] of UNITS) {
    if (Math.abs(amount) < limit) return format.format(amount, unit);
    amount = Math.round(amount / limit);
  }

  return format.format(amount, 'year');
}
