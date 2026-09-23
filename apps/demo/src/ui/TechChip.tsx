import { techById } from '../tech';

interface TechChipProps {
  id: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}

export function TechChip({ id, count, active = false, onClick }: TechChipProps) {
  const tech = techById(id);
  const label = tech?.label ?? id;
  const classes = [
    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors',
    active
      ? 'border-accent bg-accent text-ink-0'
      : 'border-line text-text-2 hover:border-text-2 hover:text-text-1',
  ].join(' ');

  if (!onClick) {
    return <span className={classes}>{label}</span>;
  }

  return (
    <button type="button" className={classes} aria-pressed={active} onClick={onClick}>
      {label}
      {count !== undefined && <span className="opacity-60">{count}</span>}
    </button>
  );
}
