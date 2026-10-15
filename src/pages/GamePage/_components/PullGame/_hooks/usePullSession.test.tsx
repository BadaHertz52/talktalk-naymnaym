// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PULL_GAME_TEST_IDS } from '../../../_constants/pullGameTestIds';
import PullGame from '..';

const HOLD_COMPLETE_MS = 12000;
const NEXT_GUARD_PASSED_MS = 700;
const FINE_POINTER_TAPS = 40;

function renderPullGame() {
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
    ],
  });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false })),
  );
  const onNext = vi.fn();
  render(<PullGame onNext={onNext} onQuit={vi.fn()} />);

  return onNext;
}

function press(key: string) {
  fireEvent.keyDown(document.body, { key });
}

function release(key: string) {
  fireEvent.keyUp(document.body, { key });
}

function tapKey(key: string) {
  press(key);
  release(key);
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function finishWithHold() {
  press(' ');
  press('ArrowUp');
  advance(HOLD_COMPLETE_MS);
  release('ArrowUp');
  release(' ');
}

function tapEnter(times: number) {
  for (let index = 0; index < times; index++) tapKey('Enter');
}

function getResult(onNext: ReturnType<typeof vi.fn>) {
  advance(NEXT_GUARD_PASSED_MS);
  fireEvent.click(screen.getByTestId(PULL_GAME_TEST_IDS.nextAction));

  return onNext.mock.calls[0][0];
}

describe('usePullSession 키보드 입력 집계', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Space+↑ hold만으로 완주하면', () => {
    it('입력 방식은 hold이고 탭은 0회다', () => {
      const onNext = renderPullGame();

      finishWithHold();

      expect(getResult(onNext)).toMatchObject({ pullInputMethod: 'hold', pullTaps: 0 });
    });

    it('↑을 먼저 눌러도 입력 방식은 hold이고 탭은 0회다', () => {
      const onNext = renderPullGame();

      press('ArrowUp');
      press(' ');
      advance(HOLD_COMPLETE_MS);

      expect(getResult(onNext)).toMatchObject({ pullInputMethod: 'hold', pullTaps: 0 });
    });
  });

  describe('hold 키 단독 입력은', () => {
    it('Space 탭 1회가 탭 1회로 집계된다', () => {
      const onNext = renderPullGame();

      tapKey(' ');
      tapEnter(FINE_POINTER_TAPS);

      expect(getResult(onNext)).toMatchObject({
        pullInputMethod: 'tap',
        pullTaps: FINE_POINTER_TAPS,
      });
    });

    it('↑ 탭 1회가 탭 1회로 집계된다', () => {
      const onNext = renderPullGame();

      tapKey('ArrowUp');
      tapEnter(FINE_POINTER_TAPS - 1);

      expect(getResult(onNext)).toMatchObject({
        pullInputMethod: 'tap',
        pullTaps: FINE_POINTER_TAPS,
      });
    });
  });

  describe('Enter 탭만으로 완주하면', () => {
    it('입력 방식은 tap이고 탭은 완주 타수와 같다', () => {
      const onNext = renderPullGame();

      tapEnter(FINE_POINTER_TAPS);

      expect(getResult(onNext)).toMatchObject({
        pullInputMethod: 'tap',
        pullTaps: FINE_POINTER_TAPS,
      });
    });
  });

  describe('탭 후 hold를 하면', () => {
    it('입력 방식은 mixed이고 hold의 첫 키는 탭에서 제외된다', () => {
      const onNext = renderPullGame();

      tapKey('Enter');
      tapKey(' ');
      finishWithHold();

      expect(getResult(onNext)).toMatchObject({ pullInputMethod: 'mixed', pullTaps: 2 });
    });
  });
});
