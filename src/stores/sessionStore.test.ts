import { describe, it, expect } from 'vitest';
import { useSessionStore } from './sessionStore';

function completeAllSteps() {
  useSessionStore.getState().completeInput({ text: 'hi', secretMode: false });
  useSessionStore.getState().completeMeasure({ intensity: 5, gameMode: 'scratch' });
  useSessionStore.getState().completeGame({ cleared: true });
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

      useSessionStore.getState().completeMeasure({ intensity: 7, gameMode: 'scratch' });

      const { steps } = useSessionStore.getState();
      expect(steps.measure.completed).toBe(true);
      expect(steps.measure.data.intensityBefore).toBe(7);
      expect(steps.game.completed).toBe(false);
      expect(steps.game.data).toEqual({ cleared: false, replayCount: 0 });
      expect(steps.result.completed).toBe(false);
      expect(steps.result.data).toEqual({ intensityAfter: null, afterEmotionText: '' });
      expect(steps.input.completed).toBe(true);
      expect(steps.input.data.emotionText).toBe('hi');
    });

    it('값이 바뀌지 않으면 game·result 단계는 초기화되지 않고 유지된다', () => {
      completeAllSteps();

      useSessionStore.getState().completeMeasure({ intensity: 5, gameMode: 'scratch' });

      const { steps } = useSessionStore.getState();
      expect(steps.game.completed).toBe(true);
      expect(steps.result.completed).toBe(true);
      expect(steps.result.data).toEqual({ intensityAfter: 2, afterEmotionText: 'done' });
    });
  });

  describe('measure 단계의 gameMode', () => {
    it('강도는 같고 모드만 바뀌면 game·result 단계가 초기화되고 새 모드가 저장된다', () => {
      completeAllSteps();

      useSessionStore.getState().completeMeasure({ intensity: 5, gameMode: 'pull' });

      const { steps } = useSessionStore.getState();
      expect(steps.measure.data).toEqual({ intensityBefore: 5, gameMode: 'pull' });
      expect(steps.game).toEqual({ completed: false, data: { cleared: false, replayCount: 0 } });
      expect(steps.result).toEqual({
        completed: false,
        data: { intensityAfter: null, afterEmotionText: '' },
      });
    });
  });

  describe('game 단계', () => {
    it('cleared를 false로 완료하면 completed는 true이고 cleared는 false로 저장된다', () => {
      useSessionStore.getState().reset();

      useSessionStore.getState().completeGame({ cleared: false });

      const { game } = useSessionStore.getState().steps;
      expect(game.completed).toBe(true);
      expect(game.data.cleared).toBe(false);
    });

    it('incrementReplayCount를 호출하면 replayCount만 1 늘고 completed와 result 단계는 유지된다', () => {
      completeAllSteps();

      useSessionStore.getState().incrementReplayCount();

      const { steps } = useSessionStore.getState();
      expect(steps.game.data.replayCount).toBe(1);
      expect(steps.game.completed).toBe(true);
      expect(steps.result.completed).toBe(true);
    });

    it('재플레이 후 완료해도 누적된 replayCount가 유지된다', () => {
      useSessionStore.getState().reset();
      useSessionStore.getState().incrementReplayCount();
      useSessionStore.getState().incrementReplayCount();

      useSessionStore.getState().completeGame({ cleared: true });

      expect(useSessionStore.getState().steps.game.data).toEqual({ cleared: true, replayCount: 2 });
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
