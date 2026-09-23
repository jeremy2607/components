import { useCallback, useEffect, useRef, useState } from 'react';
import type { Site } from '../../data/types';
import { stepSimulation } from './simulation';

const DEFAULT_INTERVAL = 2000;

export interface ActivitySimulator {
  sites: readonly Site[];
  running: boolean;
  /** Nombre de sites dont le statut diffère du parc d'origine. */
  changed: number;
  toggle: () => void;
  reset: () => void;
}

/**
 * Bascule des statuts à intervalle régulier, jusqu'à l'arrêt.
 *
 * Le minuteur ne tourne que pendant la simulation, et il est coupé au
 * démontage comme à l'arrêt.
 */
export function useActivitySimulator(
  base: readonly Site[],
  intervalMs = DEFAULT_INTERVAL,
): ActivitySimulator {
  const [sites, setSites] = useState<readonly Site[]>(base);
  const [running, setRunning] = useState(false);

  const step = useCallback(() => {
    setSites((current) => stepSimulation(current, { random: Math.random }));
  }, []);

  useEffect(() => {
    if (!running) return;

    const id = window.setInterval(step, intervalMs);
    return () => {
      window.clearInterval(id);
    };
  }, [running, intervalMs, step]);

  const toggle = useCallback(() => {
    setRunning((current) => !current);
  }, []);

  const baseRef = useRef(base);
  const reset = useCallback(() => {
    setRunning(false);
    setSites(baseRef.current);
  }, []);

  let changed = 0;
  for (let index = 0; index < base.length; index += 1) {
    if (sites[index]?.status !== base[index]?.status) changed += 1;
  }

  return { sites, running, changed, toggle, reset };
}
