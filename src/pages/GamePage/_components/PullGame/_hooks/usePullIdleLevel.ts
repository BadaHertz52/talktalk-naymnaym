import { useEffect, useState } from 'react';

export type IdleLevel = 'none' | 'relax' | 'rest';

const IDLE_RELAX_MS = 3000;
// 버튼 라벨과 힌트·스크린리더 안내가 같은 시점에 바뀌도록 멈춤 단계는 하나로 둔다 (#81)
const IDLE_REST_MS = 8000;

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

  useEffect(() => {
    setIdleLevel('none');

    if (completed || holding) {
      return;
    }

    const timeoutIds = [
      setTimeout(() => setIdleLevel('relax'), IDLE_RELAX_MS),
      setTimeout(() => setIdleLevel('rest'), IDLE_REST_MS),
    ];

    return () => timeoutIds.forEach(clearTimeout);
  }, [inputCount, holding, completed]);

  return idleLevel;
}
