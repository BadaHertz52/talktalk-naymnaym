import { describe, it, expect, beforeAll } from 'vitest';
import type { useSessionStore as UseSessionStoreType } from './sessionStore';

let useSessionStore: typeof UseSessionStoreType;

beforeAll(async () => {
  // ponytail: node에는 sessionStorage가 없음 — persist 하이드레이션용 최소 인메모리 스텁
  (globalThis as unknown as { sessionStorage: Storage }).sessionStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  } as Storage;
  ({ useSessionStore } = await import('./sessionStore'));
});

function completeAllSteps() {
  useSessionStore.getState().completeInput({ text: 'hi', secretMode: false });
  useSessionStore.getState().completeMeasure(5);
  useSessionStore.getState().completeGame();
  useSessionStore.getState().completeResult({ intensityAfter: 2, afterEmotionText: 'done' });
}

describe('sessionStore cascade reset', () => {
  describe('input 단계', () => {
    it('emotionText가 바뀌면 measure·game·result 단계가 초기화된다', () => {
      completeAllSteps();

      useSessionStore.getState().completeInput({ text: 'bye', secretMode: false });

      const { steps } = useSessionStore.getState();
      expect(steps.input.data.emotionText).toBe('bye');
      expect(steps.measure.completed).toBe(false);
      expect(steps.measure.data.intensityBefore).toBeNull();
      expect(steps.game.completed).toBe(false);
      expect(steps.result.completed).toBe(false);
      expect(steps.result.data).toEqual({ intensityAfter: null, afterEmotionText: '' });
    });

    it('secretMode만 바뀐 경우 값 변경으로 보지 않아 measure·game·result 단계가 초기화되지 않는다', () => {
      completeAllSteps();

      useSessionStore.getState().completeInput({ text: 'hi', secretMode: true });

      const { steps } = useSessionStore.getState();
      expect(steps.input.data.secretMode).toBe(true);
      expect(steps.measure.completed).toBe(true);
      expect(steps.game.completed).toBe(true);
      expect(steps.result.completed).toBe(true);
    });
  });

  describe('measure 단계', () => {
    it('값이 바뀌면 game·result 단계는 초기화되고 input 단계는 유지된다', () => {
      completeAllSteps();

      useSessionStore.getState().completeMeasure(7);

      const { steps } = useSessionStore.getState();
      expect(steps.measure.completed).toBe(true);
      expect(steps.measure.data.intensityBefore).toBe(7);
      expect(steps.game.completed).toBe(false);
      expect(steps.game.data).toEqual({});
      expect(steps.result.completed).toBe(false);
      expect(steps.result.data).toEqual({ intensityAfter: null, afterEmotionText: '' });
      expect(steps.input.completed).toBe(true);
      expect(steps.input.data.emotionText).toBe('hi');
    });

    it('값이 바뀌지 않으면 game·result 단계는 초기화되지 않고 유지된다', () => {
      completeAllSteps();

      useSessionStore.getState().completeMeasure(5);

      const { steps } = useSessionStore.getState();
      expect(steps.game.completed).toBe(true);
      expect(steps.result.completed).toBe(true);
      expect(steps.result.data).toEqual({ intensityAfter: 2, afterEmotionText: 'done' });
    });
  });

  describe('reset', () => {
    it('호출하면 input을 포함한 모든 단계가 초기 상태로 복원된다', () => {
      useSessionStore.getState().completeInput({ text: 'x', secretMode: true });
      useSessionStore.getState().reset();
      expect(useSessionStore.getState().steps.input).toEqual({
        completed: false,
        data: { emotionText: '', secretMode: false },
      });
    });
  });
});
