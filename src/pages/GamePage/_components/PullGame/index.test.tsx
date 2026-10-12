// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@stores/sessionStore';
import PullGame from '.';

const PRIMARY_LABEL = '영차! 뽑기';
const HOLD_LABEL = '꾹 눌러서 뽑기';
const NEXT_LABEL = '다음 ▸';
const QUIT_LABEL = '여기까지 할래요 ▸';
const STAGE_LABEL = /당근 뽑기 무대/;

function setupFakeClock() {
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
    ],
  });
}

function stubPointer(coarse: boolean) {
  const matchMedia = vi.fn((query: string) => ({
    matches: query === '(pointer: coarse)' ? coarse : false,
  }));
  vi.stubGlobal('matchMedia', matchMedia);

  return matchMedia;
}

function renderPullGame({ coarse = false }: { coarse?: boolean } = {}) {
  const matchMedia = stubPointer(coarse);
  const onNext = vi.fn();
  const onQuit = vi.fn();
  const result = render(<PullGame onNext={onNext} onQuit={onQuit} />);

  return { ...result, onNext, onQuit, matchMedia };
}

function getPrimaryButton() {
  return screen.getByRole('button', { name: PRIMARY_LABEL });
}

function getHoldButton() {
  return screen.getByRole('button', { name: HOLD_LABEL });
}

function getStage() {
  return screen.getByRole('group', { name: STAGE_LABEL });
}

function getProgressValue() {
  return Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));
}

function tap(times: number) {
  const button = getPrimaryButton();

  for (let index = 0; index < times; index++) {
    fireEvent.pointerDown(button);
    fireEvent.pointerUp(button);
  }
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('PullGame', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('연타 버튼', () => {
    it('정밀 포인터에서 39타면 미완료이고 40타면 100%가 되며 다음 ▸이 나타난다', () => {
      setupFakeClock();
      renderPullGame();

      tap(39);
      const beforeComplete = getProgressValue();
      const nextBeforeComplete = screen.queryByRole('button', { name: NEXT_LABEL });
      tap(1);

      expect(beforeComplete).toBe(97);
      expect(nextBeforeComplete).toBeNull();
      expect(getProgressValue()).toBe(100);
      expect(screen.getByRole('button', { name: NEXT_LABEL })).toBeTruthy();
      expect(screen.queryByRole('button', { name: PRIMARY_LABEL })).toBeNull();
    });

    it('coarse 포인터에서 29타면 미완료이고 30타면 100%가 된다', () => {
      setupFakeClock();
      renderPullGame({ coarse: true });

      tap(29);
      const beforeComplete = getProgressValue();
      tap(1);

      expect(beforeComplete).toBe(96);
      expect(getProgressValue()).toBe(100);
    });

    it('pointerdown만 하고 떼지 않으면 진행률이 오르지 않는다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.pointerDown(getPrimaryButton());
      advance(3000);

      expect(getProgressValue()).toBe(0);
    });

    it('pointerup 뒤 따라오는 포인터 click은 추가 타로 세지 않는다', () => {
      setupFakeClock();
      renderPullGame();
      const button = getPrimaryButton();

      fireEvent.pointerDown(button);
      fireEvent.pointerUp(button);
      fireEvent.click(button, { detail: 1 });

      expect(getProgressValue()).toBe(2);
    });

    it('보조기기가 보낸 click(detail 0)은 1타로 센다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.click(getPrimaryButton(), { detail: 0 });

      expect(getProgressValue()).toBe(2);
    });
  });

  describe('키보드', () => {
    it.each([' ', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])(
      '무대에 포커스된 채 %j 키를 누르면 1타가 되고 기본 동작이 취소된다',
      (key) => {
        setupFakeClock();
        renderPullGame();

        const notCancelled = fireEvent.keyDown(getStage(), { key });

        expect(getProgressValue()).toBe(2);
        expect(notCancelled).toBe(false);
      },
    );

    it('repeat 키다운은 타수에 포함되지 않는다', () => {
      setupFakeClock();
      renderPullGame();
      const stage = getStage();

      fireEvent.keyDown(stage, { key: ' ' });
      fireEvent.keyDown(stage, { key: ' ', repeat: true });
      fireEvent.keyDown(stage, { key: ' ', repeat: true });

      expect(getProgressValue()).toBe(2);
    });

    it('허용되지 않은 키는 타수에 포함되지 않는다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.keyDown(getStage(), { key: 'a' });

      expect(getProgressValue()).toBe(0);
    });

    it.each(['Enter', ' '])(
      '주 버튼에 포커스된 채 %j 키를 누르면 keydown과 뒤이은 click을 합쳐 1타만 센다',
      (key) => {
        setupFakeClock();
        renderPullGame();
        const button = getPrimaryButton();

        const notCancelled = fireEvent.keyDown(button, { key });
        fireEvent.keyUp(button, { key });
        fireEvent.click(button, { detail: 0 });

        expect(getProgressValue()).toBe(2);
        expect(notCancelled).toBe(false);
      },
    );

    it('여기까지 할래요 ▸에 포커스된 채 Enter를 누르면 타수에 포함되지 않는다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.keyDown(screen.getByRole('button', { name: QUIT_LABEL }), { key: 'Enter' });

      expect(getProgressValue()).toBe(0);
    });
  });

  describe('꾹 눌러서 뽑기', () => {
    it('1초 누르고 있으면 약 10% 충전된다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.pointerDown(getHoldButton());
      advance(1000);

      expect(getProgressValue()).toBeGreaterThanOrEqual(9);
      expect(getProgressValue()).toBeLessThanOrEqual(10);
    });

    it.each(['pointerUp', 'pointerCancel', 'lostPointerCapture'] as const)(
      '%s 이후에는 충전이 멈추고 진행률이 유지된다',
      (eventName) => {
        setupFakeClock();
        renderPullGame();
        const holdButton = getHoldButton();

        fireEvent.pointerDown(holdButton);
        advance(1000);
        fireEvent[eventName](holdButton);
        const afterRelease = getProgressValue();
        advance(2000);

        expect(afterRelease).toBeGreaterThanOrEqual(9);
        expect(getProgressValue()).toBe(afterRelease);
      },
    );

    it('탭과 홀드의 기여분이 같은 게이지에 합산된다', () => {
      setupFakeClock();
      renderPullGame();

      tap(4);
      fireEvent.pointerDown(getHoldButton());
      advance(1000);

      expect(getProgressValue()).toBeGreaterThanOrEqual(19);
      expect(getProgressValue()).toBeLessThanOrEqual(20);
    });

    it('홀드 중 언마운트하면 예약된 애니메이션 프레임과 타이머가 남지 않는다', () => {
      setupFakeClock();
      const { unmount } = renderPullGame();

      fireEvent.pointerDown(getHoldButton());
      advance(100);
      unmount();

      expect(vi.getTimerCount()).toBe(0);
    });

    it('주 버튼과 동시에 존재한다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.pointerDown(getHoldButton());

      expect(getPrimaryButton()).toBeTruthy();
      expect(getHoldButton()).toBeTruthy();
    });
  });

  describe('완료(100%) 이후', () => {
    it('탭·키·홀드 입력을 모두 무시한다', () => {
      setupFakeClock();
      renderPullGame();
      tap(40);

      fireEvent.keyDown(getStage(), { key: ' ' });
      fireEvent.pointerDown(getHoldButton());
      advance(1000);

      expect(getProgressValue()).toBe(100);
    });

    it('마지막 탭의 pointerup 직후 따라오는 click은 다음 ▸을 누르지 않는다', () => {
      setupFakeClock();
      const { onNext } = renderPullGame();
      tap(39);
      const button = getPrimaryButton();

      fireEvent.pointerDown(button);
      fireEvent.pointerUp(button);
      fireEvent.click(screen.getByRole('button', { name: NEXT_LABEL }), { detail: 1 });

      expect(onNext).not.toHaveBeenCalled();
    });

    it('다음 ▸ 위에서 새로 누르고 떼면 onNext가 1번 호출된다', () => {
      setupFakeClock();
      const { onNext } = renderPullGame();
      tap(40);
      const next = screen.getByRole('button', { name: NEXT_LABEL });

      fireEvent.pointerDown(next);
      fireEvent.pointerUp(next);
      fireEvent.click(next, { detail: 1 });

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('키보드로 다음 ▸을 활성화하면 onNext가 호출된다', () => {
      setupFakeClock();
      const { onNext } = renderPullGame();
      tap(40);

      fireEvent.click(screen.getByRole('button', { name: NEXT_LABEL }), { detail: 0 });

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('뽑는 토끼 대신 완료 이미지와 CLEAR!!가 보인다', () => {
      setupFakeClock();
      renderPullGame();
      const clearBefore = screen.queryByText('CLEAR!!');

      tap(40);

      expect(clearBefore).toBeNull();
      expect(screen.getByText('CLEAR!!')).toBeTruthy();
      expect(screen.getByAltText('당근을 뽑아 든 토끼')).toBeTruthy();
      expect(screen.queryByAltText('당근을 뽑는 토끼')).toBeNull();
    });
  });

  describe('접근성 안내', () => {
    it('progressbar가 aria-valuenow/min/max로 진행률을 알린다', () => {
      setupFakeClock();
      renderPullGame();

      tap(20);
      const progressbar = screen.getByRole('progressbar');

      expect(progressbar.getAttribute('aria-valuenow')).toBe('50');
      expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
      expect(progressbar.getAttribute('aria-valuemax')).toBe('100');
    });

    it('완료 시 aria-live 영역에 안내가 1회 채워지고 이후 입력에도 바뀌지 않는다', () => {
      setupFakeClock();
      const { container } = renderPullGame();
      const liveRegion = container.querySelector('[aria-live="polite"]');
      const beforeComplete = liveRegion?.textContent;

      tap(40);
      const afterComplete = liveRegion?.textContent;
      fireEvent.keyDown(getStage(), { key: ' ' });

      expect(beforeComplete).toBe('');
      expect(afterComplete).toBe('당근 다 뽑았어요!');
      expect(liveRegion?.textContent).toBe('당근 다 뽑았어요!');
    });

    it('세션에 감정 텍스트가 있어도 화면에 렌더하지 않는다', () => {
      setupFakeClock();
      useSessionStore.getState().completeInput({ text: '발표를 망친 것 같아', secretMode: false });

      const { container } = renderPullGame();
      tap(40);

      expect(container.textContent).not.toContain('발표를 망친 것 같아');
    });
  });

  describe('카피', () => {
    it('정밀 포인터면 데스크톱 안내문과 Space 키캡을 보여준다', () => {
      setupFakeClock();
      renderPullGame();

      expect(
        screen.getByText(
          '스페이스바를 연타하거나 버튼을 눌러주세요. 꾹 눌러도 돼요. 속도는 상관없어요.',
        ),
      ).toBeTruthy();
      expect(screen.getByText('␣ Space')).toBeTruthy();
    });

    it('coarse 포인터면 모바일 안내문을 보여주고 Space 키캡을 숨긴다', () => {
      setupFakeClock();
      renderPullGame({ coarse: true });

      expect(
        screen.getByText('버튼을 연타해주세요. 꾹 눌러도 돼요. 속도는 상관없어요.'),
      ).toBeTruthy();
      expect(screen.queryByText('␣ Space')).toBeNull();
    });

    it('포인터 판정은 마운트 시 1회만 한다', () => {
      setupFakeClock();
      const { matchMedia } = renderPullGame();

      tap(5);
      const coarseQueries = matchMedia.mock.calls.filter(
        ([query]) => query === '(pointer: coarse)',
      );

      expect(coarseQueries).toHaveLength(1);
    });

    it('진행률 0~60% / 60~90% / 90% 이상에서 힌트가 3단계로 바뀐다', () => {
      setupFakeClock();
      renderPullGame();

      tap(23);
      const below60 = screen.getByText('흙이 조금씩 움직여요');
      tap(1);
      const at60 = screen.getByText('거의 올라왔어요');
      tap(12);
      const at90 = screen.getByText('조금만 더!');

      expect(below60).toBeTruthy();
      expect(at60).toBeTruthy();
      expect(at90).toBeTruthy();
    });

    it('게이지 옆 숫자 외에 타수·남은 시간 표시가 없다', () => {
      setupFakeClock();
      const { container } = renderPullGame();

      tap(10);

      expect(container.textContent).not.toMatch(/\d+\s*(타|회|초)/);
    });
  });

  describe('여기까지 할래요 ▸', () => {
    it('클릭하면 확인 없이 onQuit이 1번 호출된다', () => {
      setupFakeClock();
      const { onQuit } = renderPullGame();

      fireEvent.click(screen.getByRole('button', { name: QUIT_LABEL }));

      expect(onQuit).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  describe('무입력', () => {
    it('8초 동안 입력이 없으면 주 버튼 라벨이 바뀌고 입력하면 돌아온다', () => {
      setupFakeClock();
      renderPullGame();

      advance(8000);
      const idleButton = screen.getByRole('button', { name: '천천히 해도 괜찮아요' });
      fireEvent.pointerDown(idleButton);
      fireEvent.pointerUp(idleButton);

      expect(getPrimaryButton()).toBeTruthy();
      expect(getProgressValue()).toBe(2);
    });

    it('20초 동안 입력이 없으면 쉬어도 된다는 문구가 나타나고 저절로 사라지지 않는다', () => {
      setupFakeClock();
      renderPullGame();

      advance(20_000);
      const shown = screen.queryByText('쉬어도 괜찮아요. 준비되면 이어서 해요.');
      advance(60_000);

      expect(shown).toBeTruthy();
      expect(screen.getByText('쉬어도 괜찮아요. 준비되면 이어서 해요.')).toBeTruthy();
    });

    it('누르고 떼지 않은 채 8초가 지나도 무입력으로 본다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.pointerDown(getPrimaryButton());
      advance(8000);

      expect(screen.getByRole('button', { name: '천천히 해도 괜찮아요' })).toBeTruthy();
    });

    it('꾹 누르고 있는 동안에는 8초가 지나도 무입력으로 보지 않는다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.pointerDown(getHoldButton());
      advance(8000);

      expect(screen.queryByRole('button', { name: '천천히 해도 괜찮아요' })).toBeNull();
    });
  });
});
