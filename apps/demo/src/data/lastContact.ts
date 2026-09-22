import { randomInt } from './random';
import type { SiteStatus } from './types';

const MINUTE = 60_000;

/**
 * Date du dernier échange, cohérente avec le statut.
 *
 * Fabrique unique, partagée par le générateur initial et la simulation : un
 * site qui repasse en service doit répondre depuis peu, un site qui tombe doit
 * se taire depuis longtemps.
 */
export function lastContactFor(status: SiteStatus, random: () => number, now: number): string {
  const minutesAgo =
    status === 'offline'
      ? 120 + randomInt(random, 12_000)
      : status === 'warning'
        ? 2 + randomInt(random, 58)
        : randomInt(random, 10);

  return new Date(now - minutesAgo * MINUTE).toISOString();
}
