// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ArousalBuffer from '.';

const bottomMessage = '쉿, 토끼가 자요. 옆에서 쉬어도 돼요.';

function setupFakeClock() {
  vi.useFakeTimers();
}

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: reduce }));
}

function renderArousalBuffer({
  topMessage = '당근 다 뽑았어요!',
  onSkip = vi.fn(),
}: {
  topMessage?: string;
  onSkip?: (dwellMs: number) => void;
} = {}) {
  const footer = <button>다음 ▸</button>;
  const result = render(<ArousalBuffer topMessage={topMessage} footer={footer} onSkip={onSkip} />);

  return { ...result, onSkip };
}

describe('ArousalBuffer', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('마운트 직후', () => {
    it('상단 완료 문구와 건너뛰기 버튼이 보인다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      renderArousalBuffer();

      expect(screen.getByText('당근 다 뽑았어요!')).toBeTruthy();
      expect(screen.getByRole('button', { name: '건너뛰기' })).toBeTruthy();
    });

    it('하단 문구와 footer 버튼은 아직 DOM에 없다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      renderArousalBuffer();

      expect(screen.queryByText(bottomMessage)).toBeNull();
      expect(screen.queryByRole('button', { name: '다음 ▸' })).toBeNull();
    });
  });

  describe('1.2초가 지나면', () => {
    it('하단 문구가 나타나고 footer는 여전히 DOM에 없다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      renderArousalBuffer();

      act(() => {
        vi.advanceTimersByTime(1200);
      });

      expect(screen.getByText(bottomMessage)).toBeTruthy();
      expect(screen.queryByRole('button', { name: '다음 ▸' })).toBeNull();
    });
  });

  describe('3.0초가 지나면', () => {
    it('호출부가 넘긴 footer가 나타난다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      renderArousalBuffer();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByRole('button', { name: '다음 ▸' })).toBeTruthy();
    });
  });

  describe('reducedMotion이면', () => {
    it('하단 문구와 footer가 마운트 즉시 전부 보인다', () => {
      setupFakeClock();
      stubReducedMotion(true);
      renderArousalBuffer();

      expect(screen.getByText(bottomMessage)).toBeTruthy();
      expect(screen.getByRole('button', { name: '다음 ▸' })).toBeTruthy();
    });
  });

  describe('건너뛰기를 누르면', () => {
    it('onSkip이 호출되고 체류 시간이 함께 전달된다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      const onSkip = vi.fn();
      renderArousalBuffer({ onSkip });

      act(() => {
        vi.advanceTimersByTime(1500);
      });
      fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }));

      expect(onSkip).toHaveBeenCalledTimes(1);
      expect(onSkip.mock.calls[0]?.[0]).toEqual(expect.any(Number));
    });
  });

  describe('두 모드 비교', () => {
    it('상단 완료 문구만 다르고 나머지 DOM 구조는 동일하다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      const pull = renderArousalBuffer({ topMessage: '당근 다 뽑았어요!' });

      act(() => {
        vi.advanceTimersByTime(3000);
      });
      const pullMarkup = pull.container.innerHTML;
      cleanup();
      const scratch = renderArousalBuffer({ topMessage: '글자 다 지웠어요!' });
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(pullMarkup.replace('당근 다 뽑았어요!', '')).toBe(
        scratch.container.innerHTML.replace('글자 다 지웠어요!', ''),
      );
    });
  });
});
