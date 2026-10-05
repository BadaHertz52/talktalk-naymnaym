import { create } from 'zustand';
import type { EmotionIntensity, GameMode, SessionSteps, Step } from '@/types/session';

// 단계 추가/삭제가 드물고 수동이므로 배열이면 충분 — config 객체 불필요
const STEP_ORDER: readonly Step[] = ['input', 'measure', 'game', 'result'];

const initialSteps: SessionSteps = {
  input: { completed: false, data: { emotionText: '', secretMode: false } },
  measure: { completed: false, data: { intensityBefore: null, gameMode: null } },
  game: { completed: false, data: { cleared: false, replayCount: 0 } },
  result: { completed: false, data: { intensityAfter: null, afterEmotionText: '' } },
};

/** step 이후의 모든 단계를 초기 상태로 되돌린 steps를 반환 */
function resetAfter(steps: SessionSteps, step: Step): SessionSteps {
  const idx = STEP_ORDER.indexOf(step);
  const next: Record<Step, SessionSteps[Step]> = { ...steps };
  STEP_ORDER.forEach((s, i) => {
    if (i > idx) next[s] = initialSteps[s];
  });

  return next as SessionSteps;
}

/** prev에서 compareKeys에 있는 필드만 뽑아 비교한다 (나머지 필드는 무변경 판단에서 제외) */
function shallowEqualSubset(prev: object, compareKeys: object): boolean {
  return Object.keys(compareKeys).every(
    (k) => (prev as Record<string, unknown>)[k] === (compareKeys as Record<string, unknown>)[k],
  );
}

/**
 * step의 데이터가 이전과 같으면 이후 단계를 건드리지 않고, 다르면 이후 단계를 초기화한다.
 * compareKeys를 생략하면 data 전체로 비교하고, 넘기면 그 필드만으로 무변경 여부를 판단한다
 * (예: input 단계는 secretMode 변경을 무변경 판단에서 제외하기 위해 emotionText만 넘김).
 */
function applyStep<K extends Step>({
  steps,
  step,
  data,
  compareKeys = data,
}: {
  steps: SessionSteps;
  step: K;
  data: SessionSteps[K]['data'];
  compareKeys?: object;
}): SessionSteps {
  const unchanged = shallowEqualSubset(steps[step].data, compareKeys);
  const next: Record<Step, SessionSteps[Step]> = { ...steps };
  next[step] = { completed: true, data } as SessionSteps[K];

  return unchanged ? (next as SessionSteps) : resetAfter(next as SessionSteps, step);
}

interface SessionStore {
  steps: SessionSteps;
  completeInput: (args: { text: string; secretMode: boolean }) => void;
  completeMeasure: (args: { intensity: EmotionIntensity; gameMode: GameMode }) => void;
  completeGame: (args: { cleared: boolean }) => void;
  incrementReplayCount: () => void;
  completeResult: (args: { intensityAfter: EmotionIntensity; afterEmotionText: string }) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>()((set) => ({
  steps: initialSteps,
  completeInput: ({ text, secretMode }) =>
    set((s) => ({
      steps: applyStep({
        steps: s.steps,
        step: 'input',
        data: { emotionText: text, secretMode },
        compareKeys: { emotionText: text },
      }),
    })),
  completeMeasure: ({ intensity, gameMode }) =>
    set((s) => ({
      steps: applyStep({
        steps: s.steps,
        step: 'measure',
        data: { intensityBefore: intensity, gameMode },
      }),
    })),
  completeGame: ({ cleared }) =>
    set((s) => ({
      steps: applyStep({
        steps: s.steps,
        step: 'game',
        data: { cleared, replayCount: s.steps.game.data.replayCount },
      }),
    })),
  // 재플레이는 게임 단계 안에서 일어나는 일이라 완료 여부·이후 단계를 건드리지 않는다
  incrementReplayCount: () =>
    set((s) => ({
      steps: {
        ...s.steps,
        game: {
          ...s.steps.game,
          data: { ...s.steps.game.data, replayCount: s.steps.game.data.replayCount + 1 },
        },
      },
    })),
  completeResult: ({ intensityAfter, afterEmotionText }) =>
    set((s) => ({
      steps: applyStep({
        steps: s.steps,
        step: 'result',
        data: { intensityAfter, afterEmotionText },
      }),
    })),
  reset: () => set({ steps: initialSteps }),
}));
