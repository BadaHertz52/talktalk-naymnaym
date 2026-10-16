// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { useSessionStore } from '@stores/sessionStore';
import { PATHS } from '@constants/paths';
import { PULL_GAME_TEST_IDS } from './_constants/pullGameTestIds';
import { BUFFER_TEST_IDS, SCRATCH_GAME_TEST_IDS } from './_constants/gameTestIds';

vi.mock('@utils/analytics', () => ({ trackEvent: vi.fn() }));
const { trackEvent } = await import('@utils/analytics');
const { GA_EVENTS, GA_PARAMS } = await import('@constants/analytics');

// Canvas·ResizeObserver를 쓰는 스크래치 로직은 jsdom에서 돌지 않으므로, 하드 종료 신호(enableNextStep)만 잡아 직접 호출한다
const gameCanvas = vi.hoisted(() => ({ enableNextStep: () => {} }));
vi.mock('./_hooks/useGameCanvas', () => ({
  useGameCanvas: ({ enableNextStep }: { enableNextStep: () => void }) => {
    gameCanvas.enableNextStep = enableNextStep;

    return { progress: 0.72 };
  },
}));

const { default: GamePage } = await import('.');

function renderGamePage() {
  const router = createMemoryRouter(
    [
      { path: PATHS.measure, element: <div data-testid="measure-page" /> },
      { path: PATHS.game, element: <GamePage /> },
      { path: PATHS.result, element: <div data-testid="result-page" /> },
    ],
    { initialEntries: [PATHS.game] },
  );
  render(<RouterProvider router={router} />);

  return router;
}

function enterScratchGame() {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
  useSessionStore.getState().reset();
  useSessionStore.getState().completeInput({ text: '속상해', secretMode: false });
  useSessionStore.getState().completeMeasure({ intensity: 5, gameMode: 'scratch' });

  return renderGamePage();
}

function enterPullGame() {
  vi.useFakeTimers({
    toFake: [
      'performance',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'requestAnimationFrame',
      'cancelAnimationFrame',
    ],
  });
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
  useSessionStore.getState().reset();
  useSessionStore.getState().completeInput({ text: '속상해', secretMode: false });
  useSessionStore.getState().completeMeasure({ intensity: 5, gameMode: 'pull' });

  return renderGamePage();
}

// 정밀 포인터(matchMedia matches:false) 기준 40타면 100%
function finishPull() {
  const button = screen.getByTestId(PULL_GAME_TEST_IDS.pullAction);

  for (let index = 0; index < 40; index++) {
    fireEvent.pointerUp(button);
  }
}

function clickPullNext() {
  act(() => {
    vi.advanceTimersByTime(600);
  });
  fireEvent.click(screen.getByTestId(PULL_GAME_TEST_IDS.nextAction));
}

function playPullToBufferFooter() {
  finishPull();
  clickPullNext();
  clickTestId(BUFFER_TEST_IDS.skipAction);
}

function finishPullByKeyboard() {
  for (let index = 0; index < 40; index++) {
    fireEvent.keyDown(document.body, { key: ' ' });
    fireEvent.keyUp(document.body, { key: ' ' });
  }
}

function advanceBuffer(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function hardEndGame() {
  act(() => {
    gameCanvas.enableNextStep();
  });
}

function clickTestId(testId: string) {
  fireEvent.click(screen.getByTestId(testId));
}

function trackedCalls(eventName: string) {
  return vi.mocked(trackEvent).mock.calls.filter(([name]) => name === eventName);
}

describe('GamePage', () => {
  afterEach(() => {
    vi.mocked(trackEvent).mockClear();
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('진입 폴백', () => {
    it('gameMode 없이 /game에 접근하면 /measure로 리다이렉트된다', async () => {
      useSessionStore.getState().reset();

      const router = renderGamePage();

      expect(await screen.findByTestId('measure-page')).toBeTruthy();
      expect(router.state.location.pathname).toBe(PATHS.measure);
    });

    it('gameMode가 있으면 /game에 머문다', () => {
      const router = enterScratchGame();

      expect(screen.getByTestId(SCRATCH_GAME_TEST_IDS.heading)).toBeTruthy();
      expect(router.state.location.pathname).toBe(PATHS.game);
    });
  });

  describe('스크래치 진행 중', () => {
    it('"여기까지 할래요 ▸"를 누르면 버퍼 없이 cleared:false로 /result에 간다', () => {
      const router = enterScratchGame();

      clickTestId(SCRATCH_GAME_TEST_IDS.quitAction);

      const { game } = useSessionStore.getState().steps;
      expect(game.completed).toBe(true);
      expect(game.data.cleared).toBe(false);
      expect(router.state.location.pathname).toBe(PATHS.result);
      expect(screen.queryByTestId(BUFFER_TEST_IDS.topMessage)).toBeNull();
    });
  });

  describe('스크래치 하드 종료 후', () => {
    it('자동으로 버퍼로 넘어가지 않는다', () => {
      enterScratchGame();

      hardEndGame();

      expect(screen.queryByTestId(BUFFER_TEST_IDS.topMessage)).toBeNull();
      expect(screen.getByTestId(SCRATCH_GAME_TEST_IDS.heading)).toBeTruthy();
    });

    it('"다음 ▸"을 누르면 게임이 사라지고 상단 "글자 다 지웠어요!" 버퍼가 /game에서 렌더된다', () => {
      const router = enterScratchGame();
      hardEndGame();

      clickTestId(SCRATCH_GAME_TEST_IDS.nextAction);

      expect(screen.getByTestId(BUFFER_TEST_IDS.topMessage)).toBeTruthy();
      expect(screen.queryByTestId(SCRATCH_GAME_TEST_IDS.heading)).toBeNull();
      expect(router.state.location.pathname).toBe(PATHS.game);
      expect(useSessionStore.getState().steps.game.completed).toBe(false);
    });

    it('버퍼 footer의 "다음 ▸"을 누르면 cleared:true로 /result에 간다', () => {
      const router = enterScratchGame();
      hardEndGame();
      clickTestId(SCRATCH_GAME_TEST_IDS.nextAction);
      clickTestId(BUFFER_TEST_IDS.skipAction);

      clickTestId(BUFFER_TEST_IDS.nextAction);

      const { game } = useSessionStore.getState().steps;
      expect(game.completed).toBe(true);
      expect(game.data.cleared).toBe(true);
      expect(router.state.location.pathname).toBe(PATHS.result);
    });
  });

  describe('당근 뽑기', () => {
    it('gameMode가 pull이면 뽑기 화면이 렌더되고 스크래치는 렌더되지 않는다', () => {
      enterPullGame();

      expect(screen.getByTestId(PULL_GAME_TEST_IDS.screen)).toBeTruthy();
      expect(screen.queryByTestId(SCRATCH_GAME_TEST_IDS.heading)).toBeNull();
    });

    it('완료 후 "다음 ▸"을 누르면 상단 "당근 다 뽑았어요!" 버퍼가 렌더된다', () => {
      enterPullGame();
      finishPull();

      clickPullNext();

      expect(screen.getByTestId(BUFFER_TEST_IDS.topMessage)).toBeTruthy();
      expect(screen.queryByTestId(PULL_GAME_TEST_IDS.screen)).toBeNull();
    });

    it('버퍼 footer의 "한 번 더 뽑기"를 누르면 replayCount가 늘고 게임이 0%로 다시 시작된다', () => {
      enterPullGame();
      playPullToBufferFooter();

      clickTestId(BUFFER_TEST_IDS.replayAction);

      expect(useSessionStore.getState().steps.game.data.replayCount).toBe(1);
      expect(screen.getByTestId(PULL_GAME_TEST_IDS.screen)).toBeTruthy();
      expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
    });

    it('다시 완료하면 버퍼가 처음부터 다시 재생된다', () => {
      enterPullGame();
      playPullToBufferFooter();
      clickTestId(BUFFER_TEST_IDS.replayAction);
      finishPull();

      clickPullNext();

      expect(screen.getByTestId(BUFFER_TEST_IDS.skipAction)).toBeTruthy();
      expect(screen.queryByTestId(BUFFER_TEST_IDS.replayAction)).toBeNull();
    });

    it('3플레이를 마치면 "한 번 더 뽑기" 대신 유도 문구와 "다음 ▸"이 보인다', () => {
      enterPullGame();
      playPullToBufferFooter();
      clickTestId(BUFFER_TEST_IDS.replayAction);
      playPullToBufferFooter();
      clickTestId(BUFFER_TEST_IDS.replayAction);

      playPullToBufferFooter();

      expect(screen.queryByTestId(BUFFER_TEST_IDS.replayAction)).toBeNull();
      expect(screen.getByTestId(BUFFER_TEST_IDS.enoughMessage)).toBeTruthy();
      expect(screen.getByTestId(BUFFER_TEST_IDS.nextAction)).toBeTruthy();
    });

    it('버퍼 footer의 "다음 ▸"을 누르면 cleared:true로 /result에 간다', () => {
      const router = enterPullGame();
      playPullToBufferFooter();

      clickTestId(BUFFER_TEST_IDS.nextAction);

      const { game } = useSessionStore.getState().steps;
      expect(game.completed).toBe(true);
      expect(game.data.cleared).toBe(true);
      expect(router.state.location.pathname).toBe(PATHS.result);
    });

    it('키보드 타수로 완주하고 버튼을 키보드 활성화(click detail 0)로 눌러 버퍼를 거쳐 /result까지 간다', () => {
      const router = enterPullGame();
      finishPullByKeyboard();
      advanceBuffer(600);

      fireEvent.click(screen.getByTestId(PULL_GAME_TEST_IDS.nextAction), { detail: 0 });
      fireEvent.click(screen.getByTestId(BUFFER_TEST_IDS.skipAction), { detail: 0 });
      fireEvent.click(screen.getByTestId(BUFFER_TEST_IDS.nextAction), { detail: 0 });

      expect(useSessionStore.getState().steps.game.data.cleared).toBe(true);
      expect(router.state.location.pathname).toBe(PATHS.result);
    });

    it('"여기까지 할래요 ▸"를 누르면 버퍼 없이 cleared:false로 /result에 간다', () => {
      const router = enterPullGame();

      fireEvent.click(screen.getByTestId(PULL_GAME_TEST_IDS.quitAction));

      const { game } = useSessionStore.getState().steps;
      expect(game.completed).toBe(true);
      expect(game.data.cleared).toBe(false);
      expect(router.state.location.pathname).toBe(PATHS.result);
      expect(screen.queryByTestId(BUFFER_TEST_IDS.topMessage)).toBeNull();
    });
  });

  describe('버퍼에서 건너뛰지 않고 오래 기다려도', () => {
    it('스크래치는 3.0초 전에는 "다음 ▸"이 없고, 이후에도 /result로 저절로 넘어가지 않는다', () => {
      vi.useFakeTimers();
      const router = enterScratchGame();
      hardEndGame();
      clickTestId(SCRATCH_GAME_TEST_IDS.nextAction);

      advanceBuffer(2999);
      const nextBefore = screen.queryByTestId(BUFFER_TEST_IDS.nextAction);
      advanceBuffer(10 * 60 * 1000);

      expect(nextBefore).toBeNull();
      expect(screen.getByTestId(BUFFER_TEST_IDS.nextAction)).toBeTruthy();
      expect(router.state.location.pathname).toBe(PATHS.game);
      expect(useSessionStore.getState().steps.game.completed).toBe(false);
    });

    it('뽑기는 3.0초 전에는 "다음 ▸"이 없고, 이후에도 /result로 저절로 넘어가지 않는다', () => {
      const router = enterPullGame();
      finishPull();
      clickPullNext();

      advanceBuffer(2999);
      const nextBefore = screen.queryByTestId(BUFFER_TEST_IDS.nextAction);
      advanceBuffer(10 * 60 * 1000);

      expect(nextBefore).toBeNull();
      expect(screen.getByTestId(BUFFER_TEST_IDS.nextAction)).toBeTruthy();
      expect(router.state.location.pathname).toBe(PATHS.game);
      expect(useSessionStore.getState().steps.game.completed).toBe(false);
    });
  });

  describe('스크래치 버퍼 footer', () => {
    it('"한 번 더 뽑기" 없이 "다음 ▸"만 있다', () => {
      enterScratchGame();
      hardEndGame();
      clickTestId(SCRATCH_GAME_TEST_IDS.nextAction);

      clickTestId(BUFFER_TEST_IDS.skipAction);

      expect(screen.queryByTestId(BUFFER_TEST_IDS.replayAction)).toBeNull();
      expect(screen.getByTestId(BUFFER_TEST_IDS.nextAction)).toBeTruthy();
    });
  });

  describe('game_abandon GA 이벤트', () => {
    it('스크래치에서 중도 이탈하면 game_mode와 0~1 progress_ratio로 1회 전송된다', () => {
      enterScratchGame();

      clickTestId(SCRATCH_GAME_TEST_IDS.quitAction);

      expect(trackedCalls(GA_EVENTS.gameAbandon)).toEqual([
        [
          GA_EVENTS.gameAbandon,
          { [GA_PARAMS.gameMode]: 'scratch', [GA_PARAMS.progressRatio]: 0.72 },
        ],
      ]);
    });

    it('뽑기에서 중도 이탈하면 game_mode와 0~1 progress_ratio가 전송된다', () => {
      enterPullGame();
      const button = screen.getByTestId(PULL_GAME_TEST_IDS.pullAction);
      for (let index = 0; index < 10; index++) fireEvent.pointerUp(button);

      fireEvent.click(screen.getByTestId(PULL_GAME_TEST_IDS.quitAction));

      const [[, params]] = trackedCalls(GA_EVENTS.gameAbandon);
      expect(params).toMatchObject({ [GA_PARAMS.gameMode]: 'pull' });
      const ratio = (params as Record<string, number>)[GA_PARAMS.progressRatio];
      expect(ratio).toBeGreaterThan(0);
      expect(ratio).toBeLessThanOrEqual(1);
    });

    it('스크래치를 버퍼까지 거쳐 정상 완료하면 game_abandon은 전송되지 않는다', () => {
      enterScratchGame();
      hardEndGame();
      clickTestId(SCRATCH_GAME_TEST_IDS.nextAction);
      clickTestId(BUFFER_TEST_IDS.skipAction);

      clickTestId(BUFFER_TEST_IDS.nextAction);

      expect(trackedCalls(GA_EVENTS.gameAbandon)).toHaveLength(0);
    });

    it('뽑기를 버퍼까지 거쳐 정상 완료하면 game_abandon은 전송되지 않는다', () => {
      enterPullGame();
      playPullToBufferFooter();

      clickTestId(BUFFER_TEST_IDS.nextAction);

      expect(trackedCalls(GA_EVENTS.gameAbandon)).toHaveLength(0);
    });

    it('어떤 이벤트 인자에도 감정 원문이 포함되지 않는다', () => {
      enterScratchGame();

      clickTestId(SCRATCH_GAME_TEST_IDS.quitAction);

      expect(JSON.stringify(vi.mocked(trackEvent).mock.calls)).not.toContain('속상해');
    });
  });
  describe('step_game_complete GA 이벤트', () => {
    function completeParams() {
      const [[, params]] = trackedCalls(GA_EVENTS.gameComplete);

      return params as Record<string, unknown>;
    }

    it('스크래치를 버퍼 건너뛰기로 완료하면 buffer_skipped true와 숫자 dwell로 1회 전송된다', () => {
      enterScratchGame();
      hardEndGame();
      clickTestId(SCRATCH_GAME_TEST_IDS.nextAction);
      clickTestId(BUFFER_TEST_IDS.skipAction);

      clickTestId(BUFFER_TEST_IDS.nextAction);

      expect(trackedCalls(GA_EVENTS.gameComplete)).toHaveLength(1);
      expect(completeParams()).toMatchObject({
        [GA_PARAMS.gameCleared]: true,
        [GA_PARAMS.bufferSkipped]: true,
        [GA_PARAMS.gameMode]: 'scratch',
        [GA_PARAMS.scratchRatio]: 0.72,
        [GA_PARAMS.gameReplayCount]: 0,
      });
      expect(typeof completeParams()[GA_PARAMS.bufferDwellMs]).toBe('number');
      expect(typeof completeParams()[GA_PARAMS.gameDurationMs]).toBe('number');
      expect(useSessionStore.getState().steps.game.data.cleared).toBe(true);
    });

    it('버퍼를 건너뛰지 않고 끝까지 보면 buffer_skipped false와 3초 이상의 dwell이 전송된다', () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
      enterScratchGame();
      hardEndGame();
      clickTestId(SCRATCH_GAME_TEST_IDS.nextAction);
      act(() => {
        vi.advanceTimersByTime(3500);
      });

      clickTestId(BUFFER_TEST_IDS.nextAction);

      expect(completeParams()).toMatchObject({
        [GA_PARAMS.bufferSkipped]: false,
        [GA_PARAMS.bufferDwellMs]: 3500,
      });
    });

    it('뽑기를 완료하면 pull_taps와 pull_input_method tap이 전송된다', () => {
      enterPullGame();
      playPullToBufferFooter();

      clickTestId(BUFFER_TEST_IDS.nextAction);

      expect(completeParams()).toMatchObject({
        [GA_PARAMS.gameCleared]: true,
        [GA_PARAMS.gameMode]: 'pull',
        [GA_PARAMS.pullTaps]: 40,
        [GA_PARAMS.pullInputMethod]: 'tap',
        [GA_PARAMS.gameReplayCount]: 0,
      });
    });

    it('한 번 더 뽑은 뒤 완료하면 game_replay_count가 1로 전송된다', () => {
      enterPullGame();
      playPullToBufferFooter();
      clickTestId(BUFFER_TEST_IDS.replayAction);
      playPullToBufferFooter();

      clickTestId(BUFFER_TEST_IDS.nextAction);

      expect(trackedCalls(GA_EVENTS.gameComplete)).toHaveLength(1);
      expect(completeParams()[GA_PARAMS.gameReplayCount]).toBe(1);
    });

    it('중도 이탈하면 cleared false, buffer_skipped true, dwell 0으로 전송된다', () => {
      enterScratchGame();

      clickTestId(SCRATCH_GAME_TEST_IDS.quitAction);

      expect(completeParams()).toMatchObject({
        [GA_PARAMS.gameCleared]: false,
        [GA_PARAMS.bufferSkipped]: true,
        [GA_PARAMS.bufferDwellMs]: 0,
        [GA_PARAMS.gameMode]: 'scratch',
        [GA_PARAMS.scratchRatio]: 0.72,
      });
    });

    it('step_game_complete 인자에도 감정 원문이 포함되지 않는다', () => {
      enterScratchGame();
      hardEndGame();
      clickTestId(SCRATCH_GAME_TEST_IDS.nextAction);
      clickTestId(BUFFER_TEST_IDS.skipAction);

      clickTestId(BUFFER_TEST_IDS.nextAction);

      expect(JSON.stringify(trackedCalls(GA_EVENTS.gameComplete))).not.toContain('속상해');
    });
  });
});
