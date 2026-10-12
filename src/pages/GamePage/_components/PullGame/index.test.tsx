// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@stores/sessionStore';
import PullGame from '.';

const PRIMARY_LABEL = '영차! 뽑기';
const NEXT_LABEL = '다음 ▸';
const QUIT_LABEL = '여기까지 할래요 ▸';

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

function renderPullGame() {
  const onNext = vi.fn();
  const onQuit = vi.fn();
  const result = render(<PullGame onNext={onNext} onQuit={onQuit} />);

  return { ...result, onNext, onQuit };
}

function getPrimaryButton() {
  return screen.getByRole('button', { name: PRIMARY_LABEL });
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
    vi.restoreAllMocks();
  });

  describe('연타 버튼', () => {
    it('39타면 미완료이고 40타면 100%가 되며 다음 ▸이 나타난다', () => {
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

  describe('키보드 한 번 뽑기', () => {
    it('포커스가 어디에도 없어도 Space를 누르면 1타가 된다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.keyDown(document.body, { key: ' ' });

      expect(getProgressValue()).toBe(2);
    });

    it('Enter와 ↑도 각각 1타가 된다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.keyDown(document.body, { key: 'Enter' });
      fireEvent.keyDown(document.body, { key: 'ArrowUp' });

      expect(getProgressValue()).toBe(5);
    });

    it('←·→·↓는 타수에 포함되지 않는다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.keyDown(document.body, { key: ' ' });
      fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
      fireEvent.keyDown(document.body, { key: 'ArrowRight' });
      fireEvent.keyDown(document.body, { key: 'ArrowDown' });

      expect(getProgressValue()).toBe(2);
    });

    it('키를 누르고 있어 repeat 이벤트가 와도 게이지가 오르지 않는다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.keyDown(document.body, { key: ' ', repeat: false });
      fireEvent.keyDown(document.body, { key: ' ', repeat: true });

      expect(getProgressValue()).toBe(2);
    });

    it('여기까지 할래요 ▸에 포커스된 채 Space를 누르면 1타가 아니라 이탈이 동작한다', () => {
      setupFakeClock();
      const { onQuit } = renderPullGame();
      const quitButton = screen.getByRole('button', { name: QUIT_LABEL });

      fireEvent.keyDown(quitButton, { key: ' ' });
      fireEvent.click(quitButton, { detail: 0 });

      expect(getProgressValue()).toBe(0);
      expect(onQuit).toHaveBeenCalledTimes(1);
    });
  });

  describe('누르고 있기', () => {
    it('영차! 뽑기를 누른 채 떼지 않으면 게이지가 오르지 않는다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.pointerDown(getPrimaryButton());
      advance(1000);

      expect(getProgressValue()).toBe(0);
    });

    it('꾹 눌러서 뽑기 버튼이 없다', () => {
      setupFakeClock();
      renderPullGame();

      expect(screen.queryByRole('button', { name: '꾹 눌러서 뽑기' })).toBeNull();
    });
  });

  describe('쭈욱 뽑기 (Space+↑)', () => {
    it('Space와 ↑를 함께 누르고 있으면 1초에 약 10% 오른다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.keyDown(document.body, { key: ' ' });
      fireEvent.keyDown(document.body, { key: 'ArrowUp' });
      advance(1000);

      expect(getProgressValue()).toBeGreaterThanOrEqual(11);
      expect(getProgressValue()).toBeLessThanOrEqual(13);
    });

    it('둘 중 하나를 떼면 충전이 멈추고 진행률이 유지된다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.keyDown(document.body, { key: ' ' });
      fireEvent.keyDown(document.body, { key: 'ArrowUp' });
      advance(1000);
      const afterCharge = getProgressValue();
      fireEvent.keyUp(document.body, { key: 'ArrowUp' });
      advance(2000);

      expect(afterCharge).toBeGreaterThanOrEqual(9);
      expect(getProgressValue()).toBe(afterCharge);
    });

    it('동시 입력을 완성하는 두 번째 키는 별도 1타로 세지 않는다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.keyDown(document.body, { key: ' ' });
      fireEvent.keyDown(document.body, { key: 'ArrowUp' });

      expect(getProgressValue()).toBe(2);
    });

    it('Space만 계속 누르고 있으면 첫 1타 이후 게이지가 오르지 않는다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.keyDown(document.body, { key: ' ' });
      fireEvent.keyDown(document.body, { key: ' ', repeat: true });
      fireEvent.keyDown(document.body, { key: ' ', repeat: true });
      advance(1000);

      expect(getProgressValue()).toBe(2);
    });

    it('쭈욱 뽑기 중에는 8초가 지나도 무입력으로 보지 않는다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.keyDown(document.body, { key: ' ' });
      fireEvent.keyDown(document.body, { key: 'ArrowUp' });
      advance(8000);

      expect(screen.queryByRole('button', { name: '천천히 해도 괜찮아요' })).toBeNull();
    });

    it('언마운트하면 window 키 리스너와 예약된 애니메이션 프레임이 남지 않는다', () => {
      setupFakeClock();
      const addEventListener = vi.spyOn(window, 'addEventListener');
      const removeEventListener = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderPullGame();

      fireEvent.keyDown(document.body, { key: ' ' });
      fireEvent.keyDown(document.body, { key: 'ArrowUp' });
      unmount();

      expect(addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('완료(100%) 이후', () => {
    it('탭과 키 입력을 모두 무시한다', () => {
      setupFakeClock();
      renderPullGame();
      tap(40);

      fireEvent.keyDown(document.body, { key: ' ' });

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
      fireEvent.keyDown(document.body, { key: ' ' });

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

  describe('안내문', () => {
    it('한 번 뽑기와 쭈욱 뽑기 안내를 키캡 없이 문장으로 보여준다', () => {
      setupFakeClock();
      const { container } = renderPullGame();

      expect(screen.getByText('한 번 뽑기')).toBeTruthy();
      expect(screen.getByText('- 스페이스바, 엔터, ⬆️ 또는 뽑기 버튼')).toBeTruthy();
      expect(screen.getByText('쭈욱 뽑기')).toBeTruthy();
      expect(screen.getByText('- 스페이스바 + ⬆️')).toBeTruthy();
      expect(container.querySelector('kbd')).toBeNull();
    });

    it('꾹 눌러도 돼요 문구와 게이지 아래 Space 키캡이 없다', () => {
      setupFakeClock();
      const { container } = renderPullGame();

      expect(container.textContent).not.toContain('꾹 눌러도 돼요');
      expect(container.textContent).not.toContain('␣ Space');
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
  });
});
