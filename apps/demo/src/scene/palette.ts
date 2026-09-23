/*
 * Les couleurs de la scène, lues sur les jetons CSS au démarrage.
 *
 * Aucune couleur n'est réécrite ici : `tokens.css` reste la source unique, et
 * la 3D se contente d'y aller voir. Les valeurs de repli ne sont pas un second
 * jeu de couleurs, seulement un filet pour le cas où la feuille n'est pas
 * encore appliquée au moment où la scène se monte.
 */

export interface Palette {
  background: number;
  line: number;
  text: number;
  muted: number;
  accent: number;
  accentDim: number;
}

const FALLBACK: Palette = {
  background: 0x06080d,
  line: 0x1c2432,
  text: 0xeaf0f7,
  muted: 0x9aa9bd,
  accent: 0x3df5c5,
  accentDim: 0x1fb894,
};

/**
 * Convertit une couleur CSS en entier. Les jetons du dépôt sont tous écrits en
 * hexadécimal ; un `rgb()` peut quand même arriver, un navigateur étant libre
 * de normaliser une variable calculée.
 */
export function parseColor(value: string): number | null {
  const trimmed = value.trim();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(trimmed);
  if (hex?.[1]) {
    const digits = hex[1];
    const full =
      digits.length === 3
        ? digits
            .split('')
            .map((digit) => digit + digit)
            .join('')
        : digits;
    return Number.parseInt(full, 16);
  }

  const rgb = /^rgba?\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+)/i.exec(trimmed);
  if (rgb) {
    const [, r, g, b] = rgb;
    if (r === undefined || g === undefined || b === undefined) return null;
    const channel = (raw: string) => Math.min(255, Math.max(0, Math.round(Number(raw))));
    return (channel(r) << 16) | (channel(g) << 8) | channel(b);
  }

  return null;
}

const ROLES: Readonly<Record<keyof Palette, string>> = {
  background: '--color-ink-0',
  line: '--color-line',
  text: '--color-text-1',
  muted: '--color-text-2',
  accent: '--color-accent',
  accentDim: '--color-accent-dim',
};

export function readPalette(element: Element = document.documentElement): Palette {
  const styles = getComputedStyle(element);
  const palette = { ...FALLBACK };

  for (const [role, token] of Object.entries(ROLES) as [keyof Palette, string][]) {
    const parsed = parseColor(styles.getPropertyValue(token));
    if (parsed !== null) palette[role] = parsed;
  }

  return palette;
}
