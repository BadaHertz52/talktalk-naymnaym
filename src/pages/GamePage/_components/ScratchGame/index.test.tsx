// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@stores/sessionStore';
import { SCRATCH_GAME_TEST_IDS } from '../../_constants/gameTestIds';
import { SCRATCH_DONE_ANNOUNCEMENT, SCRATCH_SCRUBBING_ANNOUNCEMENT } from './announcements';

// Canvas·ResizeObserver를 쓰는 스크래치 로직은 jsdom에서 돌지 않으므로, 하드 종료 신호(enableNextStep)만 잡아 직접 호출한다
const gameCanvas = vi.hoisted(() => ({ enableNextStep: () => {}, progress: 0.72 }));
vi.mock('../../_hooks/useGameCanvas', () => ({
  useGameCanvas: ({ enableNextStep }: { enableNextStep: () => void }) => {
    gameCanvas.enableNextStep = enableNextStep;

    return { progress: gameCanvas.progress };
  },
}));

const { default: ScratchGame } = await import('.');

function renderScratchGame({ progress = 0.72 }: { progress?: number } = {}) {
  gameCanvas.progress = progress;
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

  describe('스크린리더 안내', () => {
    function getAnnouncement() {
      return screen.getByTestId(SCRATCH_GAME_TEST_IDS.announcement);
    }

    it('지우기 전에는 안내가 비어 있다', () => {
      renderScratchGame({ progress: 0 });

      expect(getAnnouncement().textContent).toBe('');
    });

    it('진행률이 여러 번 바뀌어도 안내 문구는 지우는 중에서 바뀌지 않는다', () => {
      renderScratchGame({ progress: 0.1 });
      const first = getAnnouncement().textContent;

      cleanup();
      renderScratchGame({ progress: 0.6 });

      expect(first).toBe(SCRATCH_SCRUBBING_ANNOUNCEMENT);
      expect(getAnnouncement().textContent).toBe(SCRATCH_SCRUBBING_ANNOUNCEMENT);
    });

    it('완료되면 다음으로 넘어갈 수 있다는 문구로 바뀐다', () => {
      renderScratchGame();

      hardEndGame();

      expect(getAnnouncement().textContent).toBe(SCRATCH_DONE_ANNOUNCEMENT);
    });

    it('화면의 진행률 문구 요소에는 aria-live가 없다', () => {
      renderScratchGame();

      expect(screen.getByTestId(SCRATCH_GAME_TEST_IDS.progress).hasAttribute('aria-live')).toBe(
        false,
      );
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
