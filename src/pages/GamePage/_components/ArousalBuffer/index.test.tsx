// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ASSETS } from '@game/assets';
import { BUFFER_TEST_IDS } from '../../_constants/gameTestIds';
import ArousalBuffer from '.';

function setupFakeClock() {
  vi.useFakeTimers();
}

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: reduce }));
}

function renderArousalBuffer({
  topMessage = '당근 다 뽑았어요!',
  twoButtons = false,
}: { topMessage?: string; twoButtons?: boolean } = {}) {
  const footerCalls: { skipped: boolean; getDwellMs: () => number }[] = [];
  const result = render(
    <ArousalBuffer
      topMessage={topMessage}
      footer={(ctx) => {
        footerCalls.push(ctx);

        return (
          <>
            {twoButtons && <button data-testid={BUFFER_TEST_IDS.replayAction}>한 번 더</button>}
            <button data-testid={BUFFER_TEST_IDS.nextAction}>다음 ▸</button>
          </>
        );
      }}
    />,
  );

  return { ...result, footerCalls };
}

function clickSkip() {
  fireEvent.click(screen.getByTestId(BUFFER_TEST_IDS.skipAction));
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

      expect(screen.getByTestId(BUFFER_TEST_IDS.topMessage)).toBeTruthy();
      expect(screen.getByTestId(BUFFER_TEST_IDS.skipAction)).toBeTruthy();
    });

    it('하단 문구와 footer 버튼은 아직 DOM에 없다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      renderArousalBuffer();

      expect(screen.queryByTestId(BUFFER_TEST_IDS.bottomMessage)).toBeNull();
      expect(screen.queryByTestId(BUFFER_TEST_IDS.nextAction)).toBeNull();
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

      expect(screen.getByTestId(BUFFER_TEST_IDS.bottomMessage)).toBeTruthy();
      expect(screen.queryByTestId(BUFFER_TEST_IDS.nextAction)).toBeNull();
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

      expect(screen.getByTestId(BUFFER_TEST_IDS.nextAction)).toBeTruthy();
    });
  });

  describe('reducedMotion이면', () => {
    it('GIF 대신 정지 프레임을 쓰고 노출 타이밍은 동일하다', () => {
      setupFakeClock();
      stubReducedMotion(true);
      renderArousalBuffer();

      const scene = document.querySelector('img');

      expect(scene?.getAttribute('src')).toBe(ASSETS.buffer.sceneStill);
      expect(screen.queryByTestId(BUFFER_TEST_IDS.bottomMessage)).toBeNull();
      expect(screen.queryByTestId(BUFFER_TEST_IDS.nextAction)).toBeNull();
    });
  });

  describe('3.0초가 지나 footer가 나타나면', () => {
    it('건너뛰기 버튼이 사라진다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      renderArousalBuffer();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.queryByTestId(BUFFER_TEST_IDS.skipAction)).toBeNull();
    });
  });

  describe('건너뛰기를 누르면', () => {
    it('하단 문구와 footer가 즉시 나타난다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      renderArousalBuffer();

      clickSkip();

      expect(screen.getByTestId(BUFFER_TEST_IDS.bottomMessage)).toBeTruthy();
      expect(screen.getByTestId(BUFFER_TEST_IDS.nextAction)).toBeTruthy();
    });

    it('건너뛰기 버튼이 사라진다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      renderArousalBuffer();

      clickSkip();

      expect(screen.queryByTestId(BUFFER_TEST_IDS.skipAction)).toBeNull();
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

  describe('마운트 직후', () => {
    it('완료 문구 h2에 포커스가 있다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      renderArousalBuffer();

      expect(document.activeElement).toBe(screen.getByTestId(BUFFER_TEST_IDS.topMessage));
    });
  });

  describe('footer에 버튼이 둘이면', () => {
    it('건너뛰기 클릭 후 포커스는 어떤 버튼도 아닌 footer 컨테이너에 있다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      renderArousalBuffer({ twoButtons: true });

      clickSkip();

      expect(document.activeElement).toBe(screen.getByTestId(BUFFER_TEST_IDS.footer));
    });
  });

  describe('건너뛰기를 누르면', () => {
    it('버튼에 포커스가 없었어도 footer 컨테이너로 포커스가 이동한다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      renderArousalBuffer();

      clickSkip();

      expect(document.activeElement).toBe(screen.getByTestId(BUFFER_TEST_IDS.footer));
    });
  });

  describe('건너뛰기 버튼에 포커스가 있는 채로 3.0초가 지나면', () => {
    it('중간 재렌더(1.2초)를 거쳐도 footer 컨테이너로 포커스가 이동한다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      renderArousalBuffer();
      screen.getByTestId(BUFFER_TEST_IDS.skipAction).focus();

      act(() => {
        vi.advanceTimersByTime(1200);
      });
      act(() => {
        vi.advanceTimersByTime(1800);
      });

      expect(document.activeElement).toBe(screen.getByTestId(BUFFER_TEST_IDS.footer));
    });
  });

  describe('다른 버튼에 포커스가 있는 채로 3.0초가 지나면', () => {
    it('포커스가 그 버튼에 머물고 footer는 나타난다', () => {
      setupFakeClock();
      stubReducedMotion(false);
      render(<button data-testid="outside">밖</button>);
      renderArousalBuffer();
      const outside = screen.getByTestId('outside');
      outside.focus();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByTestId(BUFFER_TEST_IDS.nextAction)).toBeTruthy();
      expect(document.activeElement).toBe(outside);
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
