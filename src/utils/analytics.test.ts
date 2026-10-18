import { describe, it, expect, expectTypeOf, vi } from 'vitest';
import { trackEvent } from './analytics';
import { GA_EVENTS, GA_PARAMS } from '@constants/analytics';
import type { GameCompleteParams, ResultCompleteParams } from '@/types/analytics';

describe('trackEvent', () => {
  describe('파라미터 맵에 등록된 신규 이벤트를 보내면', () => {
    it('이벤트 이름과 파라미터가 그대로 gtag에 전달된다', () => {
      const gtag = vi.fn();
      vi.stubGlobal('window', { gtag });

      trackEvent(GA_EVENTS.gameModeSelect, {
        [GA_PARAMS.gameMode]: 'pull',
        [GA_PARAMS.intensityBefore]: 4,
        [GA_PARAMS.decisionMs]: 1200,
      });

      expect(gtag).toHaveBeenCalledWith('event', 'game_mode_select', {
        game_mode: 'pull',
        intensity_before: 4,
        decision_ms: 1200,
      });
      vi.unstubAllGlobals();
    });
  });
});

describe('analytics 파라미터 타입', () => {
  describe('신규 이벤트의 필수 파라미터가 빠지면', () => {
    it('컴파일 에러가 난다', () => {
      const invalidCalls = () => {
        // @ts-expect-error decision_ms 누락
        trackEvent(GA_EVENTS.gameModeDismiss, { [GA_PARAMS.intensityBefore]: 3 });
        // @ts-expect-error game_abandon은 파라미터가 필수
        trackEvent(GA_EVENTS.gameAbandon);
      };

      expectTypeOf(invalidCalls).toBeFunction();
    });
  });

  describe('중도 이탈(game_cleared: false) 세션이면', () => {
    it('buffer_skipped: true / buffer_dwell_ms: 0 조합만 허용된다', () => {
      expectTypeOf({
        game_mode: 'scratch',
        scratch_ratio: 0.4,
        game_cleared: false,
        buffer_skipped: true,
        buffer_dwell_ms: 0,
        game_replay_count: 0,
        game_duration_ms: 8000,
      } as const).toExtend<GameCompleteParams>();
      expectTypeOf({
        game_mode: 'scratch',
        scratch_ratio: 0.4,
        game_cleared: false,
        buffer_skipped: false,
        buffer_dwell_ms: 0,
        game_replay_count: 0,
        game_duration_ms: 8000,
      } as const).not.toExtend<GameCompleteParams>();
      expectTypeOf({
        intensity_before: 4,
        intensity_after: 4,
        intensity_change: 'same',
        game_mode: 'pull',
        game_cleared: false,
        buffer_skipped: false,
      } as const).not.toExtend<ResultCompleteParams>();
    });
  });

  describe('game_mode가 pull이면', () => {
    it('pull_taps와 pull_input_method가 필요하고 scratch_ratio로는 대체할 수 없다', () => {
      expectTypeOf({
        game_mode: 'pull',
        pull_taps: 30,
        pull_input_method: 'hold',
        game_cleared: true,
        buffer_skipped: false,
        buffer_dwell_ms: 5000,
        game_replay_count: 1,
        game_duration_ms: 9000,
      } as const).toExtend<GameCompleteParams>();
      expectTypeOf({
        game_mode: 'pull',
        scratch_ratio: 0.9,
        game_cleared: true,
        buffer_skipped: false,
        buffer_dwell_ms: 5000,
        game_replay_count: 1,
        game_duration_ms: 9000,
      } as const).not.toExtend<GameCompleteParams>();
    });
  });
});
