// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@stores/sessionStore';
import { SCRATCH_GAME_TEST_IDS } from '../../_constants/gameTestIds';

// Canvas·ResizeObserver를 쓰는 스크래치 로직은 jsdom에서 돌지 않으므로, 하드 종료 신호(enableNextStep)만 잡아 직접 호출한다
const gameCanvas = vi.hoisted(() => ({ enableNextStep: () => {} }));
vi.mock('../../_hooks/useGameCanvas', () => ({
  useGameCanvas: ({ enableNextStep }: { enableNextStep: () => void }) => {
    gameCanvas.enableNextStep = enableNextStep;

    return { progress: 0.72 };
  },
}));

const { default: ScratchGame } = await import('.');

function renderScratchGame() {
  useSessionStore.getState().reset();
  const onNext = vi.fn();
  const onQuit = vi.fn();
  render(<ScratchGame onNext={onNext} onQuit={onQuit} />);

  return { onNext, onQuit };
}

function hardEndGame() {
  act(() => {
    gameCanvas.enableNextStep();
  });
}

describe('ScratchGame', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('진행 중', () => {
    it('"다음 ▸"은 비활성이고 "여기까지 할래요 ▸"는 활성이다', () => {
      renderScratchGame();

      expect(screen.getByTestId(SCRATCH_GAME_TEST_IDS.nextAction).hasAttribute('disabled')).toBe(
        true,
      );
      expect(screen.getByTestId(SCRATCH_GAME_TEST_IDS.quitAction).hasAttribute('disabled')).toBe(
        false,
      );
    });

    it('진행률이 캔버스가 알려준 비율로 표시된다', () => {
      renderScratchGame();

      expect(screen.getByTestId(SCRATCH_GAME_TEST_IDS.progress).getAttribute('data-percent')).toBe(
        '72',
      );
    });

    it('"여기까지 할래요 ▸"를 누르면 onQuit이 1번 호출되고 onNext는 호출되지 않는다', () => {
      const { onNext, onQuit } = renderScratchGame();

      fireEvent.click(screen.getByTestId(SCRATCH_GAME_TEST_IDS.quitAction));

      expect(onQuit).toHaveBeenCalledTimes(1);
      expect(onQuit).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'scratch', scratchRatio: 0.72, progress: 0.72 }),
      );
      expect(onNext).not.toHaveBeenCalled();
    });
  });

  describe('하드 종료 후', () => {
    it('"다음 ▸"이 활성화되고 진행률이 100%로 표시된다', () => {
      renderScratchGame();

      hardEndGame();

      expect(screen.getByTestId(SCRATCH_GAME_TEST_IDS.nextAction).hasAttribute('disabled')).toBe(
        false,
      );
      expect(screen.getByTestId(SCRATCH_GAME_TEST_IDS.progress).getAttribute('data-percent')).toBe(
        '100',
      );
    });

    it('자동으로 onNext가 호출되지 않는다', () => {
      const { onNext } = renderScratchGame();

      hardEndGame();

      expect(onNext).not.toHaveBeenCalled();
    });

    it('"다음 ▸"을 누르면 onNext가 1번 호출된다', () => {
      const { onNext } = renderScratchGame();
      hardEndGame();

      fireEvent.click(screen.getByTestId(SCRATCH_GAME_TEST_IDS.nextAction));

      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('durationMs', () => {
    it('완료 후 "다음 ▸"을 늦게 눌러도 완료 순간까지의 시간만 보고된다', () => {
      vi.useFakeTimers({ toFake: ['performance'] });
      const { onNext } = renderScratchGame();
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      hardEndGame();
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      fireEvent.click(screen.getByTestId(SCRATCH_GAME_TEST_IDS.nextAction));

      expect(onNext).toHaveBeenCalledWith(expect.objectContaining({ durationMs: 2000 }));
    });
  });
});
