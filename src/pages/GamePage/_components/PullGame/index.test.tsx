// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@stores/sessionStore';
import { PULL_GAME_TEST_IDS } from '../../_constants/pullGameTestIds';
import PullGame from '.';
import { HINT_TEXT, PULL_START_INSTRUCTION } from './_components/pullHint';
import { IDLE_PULL_ARIA_LABEL, IDLE_PULL_LABEL } from './_components/pullActionLabels';

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

function renderPullGame({ coarse = false }: { coarse?: boolean } = {}) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: coarse })),
  );
  const onNext = vi.fn();
  const onQuit = vi.fn();
  const result = render(<PullGame onNext={onNext} onQuit={onQuit} />);

  return { ...result, onNext, onQuit };
}

function getPrimaryButton() {
  return screen.getByTestId(PULL_GAME_TEST_IDS.pullAction);
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

function getBunnyTransform() {
  return (screen.getByTestId(PULL_GAME_TEST_IDS.pullingVisual).parentElement as HTMLElement).style
    .transform;
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
    it('정밀 포인터에서 39타면 미완료이고 40타면 100%가 된다', () => {
      setupFakeClock();
      renderPullGame();

      tap(39);
      const beforeComplete = getProgressValue();
      tap(1);

      expect(beforeComplete).toBe(97);
      expect(getProgressValue()).toBe(100);
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

    it('포인터 판정은 마운트 시 1회만 한다', () => {
      setupFakeClock();
      renderPullGame();
      const matchMedia = vi.mocked(window.matchMedia);

      tap(1);

      expect(matchMedia).toHaveBeenCalledTimes(1);
    });

    it('39타면 미완료이고 40타면 100%가 되며 다음 ▸이 나타난다', () => {
      setupFakeClock();
      renderPullGame();

      tap(39);
      const beforeComplete = getProgressValue();
      const nextBeforeComplete = screen.queryByTestId(PULL_GAME_TEST_IDS.nextAction);
      tap(1);

      expect(beforeComplete).toBe(97);
      expect(nextBeforeComplete).toBeNull();
      expect(getProgressValue()).toBe(100);
      expect(screen.getByTestId(PULL_GAME_TEST_IDS.nextAction)).toBeTruthy();
      expect(screen.queryByTestId(PULL_GAME_TEST_IDS.pullAction)).toBeNull();
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

    it.each([' ', 'Enter', 'ArrowUp'])('%j를 누르고 있어 repeat 이벤트만 오면 게이지가 오르지 않는다', (key) => {
      setupFakeClock();
      renderPullGame();

      fireEvent.keyDown(document.body, { key, repeat: true });
      fireEvent.keyDown(document.body, { key, repeat: true });

      expect(getProgressValue()).toBe(0);
    });

    it('여기까지 할래요 ▸에 포커스된 채 Space를 누르면 1타가 아니라 이탈이 동작한다', () => {
      setupFakeClock();
      const { onQuit } = renderPullGame();
      const quitButton = screen.getByTestId(PULL_GAME_TEST_IDS.quitAction);

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

    it('쭈욱 뽑기 중에는 8초가 지나도 무입력 상태가 되지 않는다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.keyDown(document.body, { key: ' ' });
      fireEvent.keyDown(document.body, { key: 'ArrowUp' });
      advance(8000);

      expect(screen.getByTestId(PULL_GAME_TEST_IDS.screen).getAttribute('data-idle-level')).toBe(
        'none',
      );
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

  describe('토끼 위치', () => {
    it('탭을 이어가면 5% 단계가 바뀔 때만 위치가 바뀐다', () => {
      setupFakeClock();
      renderPullGame();
      const initial = getBunnyTransform();

      tap(1);
      const afterOne = getBunnyTransform();
      tap(1);
      const afterTwo = getBunnyTransform();
      tap(1);
      const afterThree = getBunnyTransform();

      expect(afterOne).toBe(initial);
      expect(afterTwo).not.toBe(afterOne);
      expect(afterThree).toBe(afterTwo);
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
      fireEvent.click(screen.getByTestId(PULL_GAME_TEST_IDS.nextAction), { detail: 1 });

      expect(onNext).not.toHaveBeenCalled();
    });

    it('다음 ▸ 위에서 새로 누르고 떼면 onNext가 1번 호출된다', () => {
      setupFakeClock();
      const { onNext } = renderPullGame();
      tap(40);
      advance(600);
      const next = screen.getByTestId(PULL_GAME_TEST_IDS.nextAction);

      fireEvent.pointerDown(next);
      fireEvent.pointerUp(next);
      fireEvent.click(next, { detail: 1 });

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('키보드로 다음 ▸을 활성화하면 onNext가 호출된다', () => {
      setupFakeClock();
      const { onNext } = renderPullGame();
      tap(40);
      advance(600);

      fireEvent.click(screen.getByTestId(PULL_GAME_TEST_IDS.nextAction), { detail: 0 });

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('완료 직후 600ms 안에 들어온 다음 ▸ 클릭은 마우스든 키보드든 무시한다', () => {
      setupFakeClock();
      const { onNext } = renderPullGame();
      tap(40);
      advance(599);
      const next = screen.getByTestId(PULL_GAME_TEST_IDS.nextAction);

      fireEvent.pointerDown(next);
      fireEvent.click(next, { detail: 1 });
      fireEvent.click(next, { detail: 0 });

      expect(onNext).not.toHaveBeenCalled();
    });

    it('뽑기 버튼에 포커스가 있다가 완료되면 포커스가 다음 ▸으로 옮겨진다', () => {
      setupFakeClock();
      renderPullGame();
      getPrimaryButton().focus();

      tap(40);

      expect(document.activeElement).toBe(screen.getByTestId(PULL_GAME_TEST_IDS.nextAction));
    });

    it('그만두기에 포커스를 둔 채 완료돼도 포커스는 그대로다', () => {
      setupFakeClock();
      renderPullGame();
      const quit = screen.getByTestId(PULL_GAME_TEST_IDS.quitAction);
      quit.focus();

      tap(40);

      expect(document.activeElement).toBe(quit);
    });

    it('완료하면 완료 상태와 성공 이미지가 보인다', () => {
      setupFakeClock();
      renderPullGame();
      const completionBefore = screen.queryByTestId(PULL_GAME_TEST_IDS.completionState);

      tap(40);

      expect(completionBefore).toBeNull();
      expect(screen.getByTestId(PULL_GAME_TEST_IDS.completionState)).toBeTruthy();
      expect(screen.getByTestId(PULL_GAME_TEST_IDS.successVisual)).toBeTruthy();
      expect(screen.queryByTestId(PULL_GAME_TEST_IDS.pullingVisual)).toBeNull();
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
      renderPullGame();
      const liveRegion = screen.getByTestId(PULL_GAME_TEST_IDS.completionAnnouncement);
      const beforeComplete = liveRegion.textContent;

      tap(40);
      const afterComplete = liveRegion.textContent;
      fireEvent.keyDown(document.body, { key: ' ' });

      expect(beforeComplete).toBe('');
      expect(afterComplete).toBeTruthy();
      expect(liveRegion.textContent).toBe(afterComplete);
    });

    it('첫 탭 전에는 live 영역이 비어 있고 첫 탭 이후 뽑는 중 문구가 된다', () => {
      setupFakeClock();
      renderPullGame();
      const liveRegion = screen.getByTestId(PULL_GAME_TEST_IDS.completionAnnouncement);
      const beforeTap = liveRegion.textContent;

      tap(1);

      expect(beforeTap).toBe('');
      expect(liveRegion.textContent).toBe(HINT_TEXT.progress);
    });

    it('진행률이 70%와 90%를 넘어도 live 문구는 뽑는 중 그대로이고 화면 힌트는 단계별로 바뀐다', () => {
      setupFakeClock();
      renderPullGame();
      const liveRegion = screen.getByTestId(PULL_GAME_TEST_IDS.completionAnnouncement);

      tap(28);
      const atNear = liveRegion.textContent;
      const nearLevel = screen.getByTestId(PULL_GAME_TEST_IDS.hint).getAttribute('data-level');
      tap(8);

      expect(atNear).toBe(HINT_TEXT.progress);
      expect(liveRegion.textContent).toBe(HINT_TEXT.progress);
      expect(nearLevel).toBe('near');
      expect(screen.getByTestId(PULL_GAME_TEST_IDS.hint).getAttribute('data-level')).toBe('close');
    });

    it('쉬는 상태에서는 쉬어도 된다는 문구가 되고 다시 탭하면 뽑는 중으로 돌아온다', () => {
      setupFakeClock();
      renderPullGame();
      const liveRegion = screen.getByTestId(PULL_GAME_TEST_IDS.completionAnnouncement);

      tap(1);
      advance(20_000);
      const resting = liveRegion.textContent;
      tap(1);

      expect(resting).toBe(HINT_TEXT.rest);
      expect(liveRegion.textContent).toBe(HINT_TEXT.progress);
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
    it('한 번 뽑기와 쭈욱 뽑기 안내를 테스트 속성으로 식별하고 키캡 없이 렌더한다', () => {
      setupFakeClock();
      renderPullGame();

      const instructions = screen.getByTestId(PULL_GAME_TEST_IDS.instructions);

      expect(screen.getByTestId(PULL_GAME_TEST_IDS.singlePullInstruction)).toBeTruthy();
      expect(screen.getByTestId(PULL_GAME_TEST_IDS.continuousPullInstruction)).toBeTruthy();
      expect(instructions.querySelector('kbd')).toBeNull();
    });

    it('안내 첫 줄에 화면에는 보이지 않는 시작 문구가 있다', () => {
      setupFakeClock();
      renderPullGame();

      const instruction = screen.getByTestId(PULL_GAME_TEST_IDS.startInstruction);

      expect(instruction.textContent).toBe(PULL_START_INSTRUCTION);
      expect(screen.getByTestId(PULL_GAME_TEST_IDS.instructions).firstElementChild).toBe(
        instruction,
      );
    });

    it('진행률 0~70% / 70~90% / 90% 이상에서 힌트가 3단계로 바뀐다', () => {
      setupFakeClock();
      renderPullGame();

      tap(27);
      expect(screen.getByTestId(PULL_GAME_TEST_IDS.hint).getAttribute('data-level')).toBe(
        'progress',
      );
      tap(1);
      expect(screen.getByTestId(PULL_GAME_TEST_IDS.hint).getAttribute('data-level')).toBe('near');
      tap(8);
      expect(screen.getByTestId(PULL_GAME_TEST_IDS.hint).getAttribute('data-level')).toBe('close');
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

      fireEvent.click(screen.getByTestId(PULL_GAME_TEST_IDS.quitAction));

      expect(onQuit).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  describe('무입력', () => {
    it('8초 동안 입력이 없으면 주 버튼 라벨이 바뀌고 입력하면 돌아온다', () => {
      setupFakeClock();
      renderPullGame();

      advance(8000);
      const idleButton = screen.getByTestId(PULL_GAME_TEST_IDS.pullAction);
      expect(screen.getByTestId(PULL_GAME_TEST_IDS.screen).getAttribute('data-idle-level')).toBe(
        'slow',
      );
      fireEvent.pointerDown(idleButton);
      fireEvent.pointerUp(idleButton);

      expect(getPrimaryButton()).toBeTruthy();
      expect(screen.getByTestId(PULL_GAME_TEST_IDS.screen).getAttribute('data-idle-level')).toBe(
        'none',
      );
      expect(getProgressValue()).toBe(2);
    });

    it('무입력 강조 중에는 뽑기 버튼의 접근 가능한 이름이 보이는 글자로 시작하고 뽑기를 포함한다', () => {
      setupFakeClock();
      renderPullGame();

      advance(8000);

      const label = screen.getByTestId(PULL_GAME_TEST_IDS.pullAction).getAttribute('aria-label');
      expect(label).toBe(IDLE_PULL_ARIA_LABEL);
      expect(label?.startsWith(IDLE_PULL_LABEL)).toBe(true);
      expect(label).toContain('뽑기');
    });

    it('20초 동안 입력이 없으면 쉬어도 된다는 문구가 나타나고 저절로 사라지지 않는다', () => {
      setupFakeClock();
      renderPullGame();

      advance(20_000);
      const hint = screen.getByTestId(PULL_GAME_TEST_IDS.hint);
      advance(60_000);

      expect(hint.getAttribute('data-level')).toBe('rest');
      expect(screen.getByTestId(PULL_GAME_TEST_IDS.hint).getAttribute('data-level')).toBe('rest');
    });

    it('누르고 떼지 않은 채 8초가 지나도 무입력으로 본다', () => {
      setupFakeClock();
      renderPullGame();

      fireEvent.pointerDown(getPrimaryButton());
      advance(8000);

      expect(screen.getByTestId(PULL_GAME_TEST_IDS.screen).getAttribute('data-idle-level')).toBe(
        'slow',
      );
    });
  });
  describe('이탈 결과', () => {
    it('입력 없이 이탈하면 pull_taps 0, 입력 방식 tap으로 보고된다', () => {
      setupFakeClock();
      const { onQuit } = renderPullGame();

      fireEvent.click(screen.getByTestId(PULL_GAME_TEST_IDS.quitAction));

      expect(onQuit).toHaveBeenCalledWith(
        expect.objectContaining({ pullTaps: 0, pullInputMethod: 'tap', progress: 0 }),
      );
    });

    it('탭만 썼으면 탭 수와 입력 방식 tap이 보고된다', () => {
      setupFakeClock();
      const { onQuit } = renderPullGame();
      tap(3);

      fireEvent.click(screen.getByTestId(PULL_GAME_TEST_IDS.quitAction));

      expect(onQuit).toHaveBeenCalledWith(
        expect.objectContaining({ pullTaps: 3, pullInputMethod: 'tap' }),
      );
    });

    it('탭과 홀드를 함께 썼으면 입력 방식 mixed가 보고된다', () => {
      setupFakeClock();
      const { onQuit } = renderPullGame();
      tap(1);
      fireEvent.keyDown(document.body, { key: ' ' });
      fireEvent.keyDown(document.body, { key: 'ArrowUp' });
      advance(100);
      fireEvent.keyUp(document.body, { key: 'ArrowUp' });

      fireEvent.click(screen.getByTestId(PULL_GAME_TEST_IDS.quitAction));

      expect(onQuit).toHaveBeenCalledWith(expect.objectContaining({ pullInputMethod: 'mixed' }));
    });

    it('마운트 후 경과한 시간이 durationMs로 보고된다', () => {
      setupFakeClock();
      const { onQuit } = renderPullGame();
      advance(1500);

      fireEvent.click(screen.getByTestId(PULL_GAME_TEST_IDS.quitAction));

      expect(onQuit).toHaveBeenCalledWith(expect.objectContaining({ durationMs: 1500 }));
    });
  });

  describe('완료 결과', () => {
    it('완료 후 "다음 ▸"을 늦게 눌러도 완료 순간까지의 시간만 보고된다', () => {
      setupFakeClock();
      const { onNext } = renderPullGame();
      advance(1000);
      tap(40);
      advance(5000);

      fireEvent.click(screen.getByTestId(PULL_GAME_TEST_IDS.nextAction));

      expect(onNext).toHaveBeenCalledWith(expect.objectContaining({ durationMs: 1000 }));
    });
  });
});
