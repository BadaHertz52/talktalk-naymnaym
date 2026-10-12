import { useEffect, useRef, useState } from 'react';

export type IdleLevel = 'none' | 'relax' | 'slow' | 'rest';

const IDLE_RELAX_MS = 3000;
const IDLE_SLOW_MS = 8000;
const IDLE_REST_MS = 20_000;

interface UsePullIdleLevelOptions {
  inputCount: number;
  holding: boolean;
  completed: boolean;
}

export function usePullIdleLevel({
  inputCount,
  holding,
  completed,
}: UsePullIdleLevelOptions): IdleLevel {
  const [idleLevel, setIdleLevel] = useState<IdleLevel>('none');
  const restShownRef = useRef(false);

  useEffect(() => {
    setIdleLevel('none');

    if (completed || holding) {
      return;
    }

    const timeoutIds = [
      setTimeout(() => setIdleLevel('relax'), IDLE_RELAX_MS),
      setTimeout(() => setIdleLevel('slow'), IDLE_SLOW_MS),
      setTimeout(() => {
        if (!restShownRef.current) {
          restShownRef.current = true;
          setIdleLevel('rest');
        }
      }, IDLE_REST_MS),
    ];

    return () => timeoutIds.forEach(clearTimeout);
  }, [inputCount, holding, completed]);

  return idleLevel;
}
