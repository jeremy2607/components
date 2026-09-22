import { ANCHORS } from './anchors';
import { createRandom, randomInt, weightedPick } from './random';
import { SITE_TAGS, type Site, type SiteStatus, type SiteTag } from './types';

const NAME_ROOTS = [
  'Ancolie',
  'Basalte',
  'Cèdre',
  'Dolomie',
  'Épicéa',
  'Faïence',
  'Garance',
  'Hêtraie',
  'Iolite',
  'Jaspe',
  'Kaolin',
  'Lavande',
  'Mistral',
  'Nacre',
  'Obsidienne',
  'Pyrite',
  'Quartz',
  'Roselière',
  'Silex',
  'Tourmaline',
  'Vervaine',
  'Zircon',
] as const;

const MODELS = ['Relais 120', 'Relais 240', 'Borne 40', 'Console 8', 'Passerelle 3'] as const;

const STATUS_WEIGHTS = [
  ['ok', 76],
  ['warning', 17],
  ['offline', 7],
] as const satisfies readonly (readonly [SiteStatus, number])[];

const KM_PER_DEGREE = 111.32;
const MINUTE = 60_000;

/** Part des sites privés de coordonnées, pour exercer le message de données manquantes. */
const MISSING_COORDINATES_RATE = 0.045;

export interface GenerateSitesOptions {
  count?: number;
  seed?: number;
  /** Injectable pour rendre les dates de dernier échange déterministes. */
  now?: Date;
}

/**
 * Loi triangulaire sur [-1, 1] : plus dense au centre qu'un tirage uniforme,
 * ce qui donne des nuages crédibles plutôt que des carrés de points.
 */
function spread(random: () => number): number {
  return random() + random() - 1;
}

function lastContactFor(status: SiteStatus, random: () => number, now: number): string {
  const minutesAgo =
    status === 'offline'
      ? 120 + randomInt(random, 12_000)
      : status === 'warning'
        ? 2 + randomInt(random, 58)
        : randomInt(random, 10);

  return new Date(now - minutesAgo * MINUTE).toISOString();
}

function tagsFor(random: () => number): readonly SiteTag[] {
  const picked = SITE_TAGS.filter(() => random() < 0.28);
  if (picked.length > 0) return picked;

  const fallback = SITE_TAGS[randomInt(random, SITE_TAGS.length)];
  return fallback ? [fallback] : [];
}

/**
 * Parc fictif réparti sur la France, avec des grappes volontaires.
 * Aucun nom, aucune coordonnée d'un parc réel.
 */
export function generateSites(options: GenerateSitesOptions = {}): Site[] {
  const { count = 240, seed = 20260922, now = new Date() } = options;
  const random = createRandom(seed);
  const timestamp = now.getTime();

  const anchorWeights = ANCHORS.map((anchor) => [anchor, anchor.weight] as const);

  return Array.from({ length: count }, (_, index) => {
    const anchor = weightedPick(random, anchorWeights);
    const status = weightedPick(random, STATUS_WEIGHTS);
    const root = NAME_ROOTS[randomInt(random, NAME_ROOTS.length)] ?? 'Quartz';
    const model = MODELS[randomInt(random, MODELS.length)] ?? 'Relais 120';
    const reference = String(index + 1).padStart(3, '0');

    const site: Site = {
      id: `site-${reference}`,
      status,
      data: {
        name: `${root} ${reference}`,
        model,
        tags: tagsFor(random),
        lastContact: lastContactFor(status, random, timestamp),
      },
    };

    if (random() < MISSING_COORDINATES_RATE) return site;

    const [northBias, eastBias] = anchor.bias ?? [0, 0];
    const northKm = spread(random) * anchor.radiusKm + northBias;
    const eastKm = spread(random) * anchor.radiusKm + eastBias;
    const lngScale = KM_PER_DEGREE * Math.cos((anchor.lat * Math.PI) / 180);

    return {
      ...site,
      lat: Number((anchor.lat + northKm / KM_PER_DEGREE).toFixed(5)),
      lng: Number((anchor.lng + eastKm / lngScale).toFixed(5)),
    };
  });
}
