/*
 * Quatre paliers, et la règle qui décide lequel s'applique.
 *
 * La décision est une fonction pure de capacités mesurées : elle se teste sans
 * navigateur, et surtout elle se relit. Un `if` dispersé dans le rendu aurait
 * fait la même chose, mais personne n'aurait su dire, six mois plus tard, ce
 * qui déclenche le mode 2D.
 */

export type Tier = 'haut' | 'moyen' | 'mobile' | '2d';

export interface Capabilities {
  webgl: boolean;
  /** `prefers-reduced-motion`. Une scène qui dérive est un mouvement, même lente. */
  reducedMotion: boolean;
  /** Pointeur grossier : un doigt, donc un téléphone ou une tablette. */
  coarsePointer: boolean;
  /** `navigator.deviceMemory`, en gigaoctets. Absent sur Safari et Firefox. */
  memory: number | null;
  cores: number | null;
}

export interface TierSettings {
  /** Plafond du rapport de pixels. Au-delà, on peint quatre fois trop. */
  maxPixelRatio: number;
  antialias: boolean;
  /** Nombre de grains de poussière. Zéro les supprime complètement. */
  dust: number;
  /** Halos additifs autour des noeuds. */
  halos: boolean;
  /** Dérive lente de la caméra au repos. */
  drift: boolean;
}

export const TIERS: Readonly<Record<Exclude<Tier, '2d'>, TierSettings>> = {
  haut: { maxPixelRatio: 1.75, antialias: true, dust: 900, halos: true, drift: true },
  moyen: { maxPixelRatio: 1.5, antialias: true, dust: 420, halos: true, drift: true },
  mobile: { maxPixelRatio: 1.25, antialias: false, dust: 0, halos: true, drift: false },
};

/**
 * `prefers-reduced-motion` et l'absence de WebGL ne dégradent pas la scène,
 * ils la remplacent : on bascule en 2D. Une 3D immobile serait une image fixe
 * à cent quarante kilo-octets, ce qui n'a d'intérêt pour personne.
 */
export function chooseTier(capabilities: Capabilities): Tier {
  if (!capabilities.webgl) return '2d';
  if (capabilities.reducedMotion) return '2d';
  if (capabilities.coarsePointer) return 'mobile';

  const { memory, cores } = capabilities;

  // Une machine qui ne dit rien est traitée comme moyenne : on ne parie pas le
  // confort du visiteur sur une absence d'information.
  if (memory !== null && memory < 4) return 'moyen';
  if (cores !== null && cores < 8) return 'moyen';
  if (memory !== null && memory >= 8 && cores !== null && cores >= 8) return 'haut';

  return 'moyen';
}

export function settingsFor(tier: Tier): TierSettings | null {
  return tier === '2d' ? null : TIERS[tier];
}

/** Détection WebGL sans garder le contexte ouvert : il est rendu aussitôt. */
export function detectWebgl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function readCapabilities(): Capabilities {
  const navigatorWithHints = navigator as Navigator & { deviceMemory?: number };

  return {
    webgl: detectWebgl(),
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    memory: navigatorWithHints.deviceMemory ?? null,
    cores: navigator.hardwareConcurrency || null,
  };
}
