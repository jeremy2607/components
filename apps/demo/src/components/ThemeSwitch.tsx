import type { ThemeMode } from '../useTheme';

const LABELS: Readonly<Record<ThemeMode, string>> = {
  system: 'Système',
  light: 'Clair',
  dark: 'Sombre',
};

interface ThemeSwitchProps {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

export function ThemeSwitch({ mode, onChange }: ThemeSwitchProps) {
  return (
    <fieldset className="theme">
      <legend className="visually-hidden">Thème</legend>
      {(Object.keys(LABELS) as ThemeMode[]).map((value) => (
        <button
          key={value}
          type="button"
          className="theme__option"
          aria-pressed={mode === value}
          onClick={() => {
            onChange(value);
          }}
        >
          {LABELS[value]}
        </button>
      ))}
    </fieldset>
  );
}
