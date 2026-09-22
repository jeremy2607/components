import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'status-map-demo:theme';
const MODES: readonly ThemeMode[] = ['system', 'light', 'dark'];

function readStored(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return MODES.includes(stored as ThemeMode) ? (stored as ThemeMode) : 'system';
}

/**
 * Thème clair, sombre, ou celui du système.
 *
 * Seul un choix explicite pose `data-theme` sur la racine ; en mode système
 * l'attribut disparaît et la feuille de style suit `prefers-color-scheme`
 * toute seule. Aucun écran n'attend le JavaScript pour connaître sa couleur.
 */
export function useTheme(): { mode: ThemeMode; setMode: (mode: ThemeMode) => void } {
  const [mode, setStateMode] = useState<ThemeMode>(readStored);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, next);
    setStateMode(next);
  }, []);

  return { mode, setMode };
}
