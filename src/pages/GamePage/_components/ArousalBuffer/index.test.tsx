// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ASSETS } from '@game/assets';
import ArousalBuffer from '.';

const bottomMessage = '쉿, 토끼가 자요. 옆에서 쉬어도 돼요.';

function setupFakeClock() {
  vi.useFakeTimers();
}

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: reduce }));
}

function renderArousalBuffer({ topMessage = '당근 다 뽑았어요!' }: { topMessage?: string } = {}) {
  const footerCalls: { skipped: boolean; getDwellMs: () => number }[] = [];
  const result = render(
    <ArousalBuffer
      topMessage={topMessage}
      footer={(ctx) => {
        footerCalls.push(ctx);

        return <button>다음 ▸</button>;
      }}
    />,
  );

  return { ...result, footerCalls };
}

function clickSkip() {
  fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }));
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
    it('GIF 대신 정지 프레임을 쓰고 노출 타이밍은 동일하다', () => {
      setupFakeClock();
      stubReducedMotion(true);
      renderArousalBuffer();

      const scene = document.querySelector('img');

      expect(scene?.getAttribute('src')).toBe(ASSETS.buffer.sceneStill);
      expect(screen.queryByText(bottomMessage)).toBeNull();
      expect(screen.queryByRole('button', { name: '다음 ▸' })).toBeNull();
    });
  });

  describe('건너뛰기를 누르면', () => {
    it('하단 문구와 footer가 즉시 나타난다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      renderArousalBuffer();

      clickSkip();

      expect(screen.getByText(bottomMessage)).toBeTruthy();
      expect(screen.getByRole('button', { name: '다음 ▸' })).toBeTruthy();
    });

    it('건너뛰기 버튼이 사라진다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      renderArousalBuffer();

      clickSkip();

      expect(screen.queryByRole('button', { name: '건너뛰기' })).toBeNull();
    });

    it('footer에 skipped가 true로 전달된다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      const { footerCalls } = renderArousalBuffer();

      clickSkip();

      expect(footerCalls.at(-1)?.skipped).toBe(true);
    });
  });

  describe('3.0초를 기다려서 footer가 나타나면', () => {
    it('footer에 skipped가 false로 전달된다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      const { footerCalls } = renderArousalBuffer();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(footerCalls.at(-1)?.skipped).toBe(false);
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
