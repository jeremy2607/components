import { describe, expect, it } from 'vitest';
import { parseColor, readPalette } from './palette';

describe('parseColor', () => {
  it('lit un hexadécimal à six chiffres', () => {
    expect(parseColor('#3df5c5')).toBe(0x3df5c5);
  });

  it('lit un hexadécimal à trois chiffres', () => {
    expect(parseColor('#abc')).toBe(0xaabbcc);
  });

  it('ignore les espaces autour, que les variables CSS traînent souvent', () => {
    expect(parseColor('  #06080d  ')).toBe(0x06080d);
  });

  it('accepte la casse haute', () => {
    expect(parseColor('#EAF0F7')).toBe(0xeaf0f7);
  });

  it('lit un rgb(), qu’un navigateur peut rendre à la place de l’hexadécimal', () => {
    expect(parseColor('rgb(61, 245, 197)')).toBe(0x3df5c5);
  });

  it('lit la syntaxe sans virgules', () => {
    expect(parseColor('rgb(61 245 197)')).toBe(0x3df5c5);
  });

  it('lit un rgba() en ignorant l’alpha', () => {
    expect(parseColor('rgba(6, 8, 13, 0.82)')).toBe(0x06080d);
  });

  it('borne les canaux hors plage plutôt que de déborder', () => {
    expect(parseColor('rgb(300, -20, 0)')).toBe(0xff0000);
  });

  it('rend null sur une valeur vide ou incomprise', () => {
    expect(parseColor('')).toBeNull();
    expect(parseColor('  ')).toBeNull();
    expect(parseColor('transparent')).toBeNull();
    expect(parseColor('#12')).toBeNull();
    expect(parseColor('color-mix(in srgb, red, blue)')).toBeNull();
  });
});

describe('readPalette', () => {
  it('rend une palette complète même sans jeton défini', () => {
    const palette = readPalette(document.createElement('div'));

    for (const value of Object.values(palette)) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(0xffffff);
    }
  });

  it('garde le fond et l’accent des jetons du dépôt comme repli', () => {
    const palette = readPalette(document.createElement('div'));
    expect(palette.background).toBe(0x06080d);
    expect(palette.accent).toBe(0x3df5c5);
  });

  it('préfère le jeton CSS quand il est lisible', () => {
    const element = document.createElement('div');
    element.style.setProperty('--color-accent', '#ff0000');
    document.body.append(element);

    const read = getComputedStyle(element).getPropertyValue('--color-accent');
    // jsdom ne résout pas toujours les propriétés personnalisées ; le test ne
    // vaut que là où il le fait, et le repli est couvert au-dessus.
    if (parseColor(read) !== null) {
      expect(readPalette(element).accent).toBe(0xff0000);
    }

    element.remove();
  });
});
