import { useEffect, useState } from 'react';

export type IdleLevel = 'none' | 'relax' | 'rest';

const IDLE_RELAX_MS = 3000;
// 버튼 라벨과 힌트·스크린리더 안내가 같은 시점에 바뀌도록 멈춤 단계는 하나로 둔다 (#81)
const IDLE_REST_MS = 8000;

interface UsePullIdleLevelOptions {
  inputCount: number;
  started: boolean;
  holding: boolean;
  completed: boolean;
}

export function usePullIdleLevel({
  inputCount,
  started,
  holding,
  completed,
}: UsePullIdleLevelOptions): IdleLevel {
  const [idleLevel, setIdleLevel] = useState<IdleLevel>('none');

  useEffect(() => {
    setIdleLevel('none');

    if (completed || holding) {
      return;
    }

    const timeoutIds = [setTimeout(() => setIdleLevel('relax'), IDLE_RELAX_MS)];
    // 멈춤은 뽑기 시작 후의 상태다. 시작 전 탐색 중에 "쉬어도 괜찮아요"가 끼어들지 않게 한다
    if (started) timeoutIds.push(setTimeout(() => setIdleLevel('rest'), IDLE_REST_MS));

    return () => timeoutIds.forEach(clearTimeout);
  }, [inputCount, started, holding, completed]);

  return idleLevel;
}
