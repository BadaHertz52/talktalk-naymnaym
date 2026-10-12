// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { useSessionStore } from '@stores/sessionStore';
import { PATHS } from '@constants/paths';

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
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
  useSessionStore.getState().reset();
  useSessionStore.getState().completeInput({ text: '속상해', secretMode: false });
  useSessionStore.getState().completeMeasure({ intensity: 5, gameMode: 'pull' });

  return renderGamePage();
}

// 정밀 포인터(matchMedia matches:false) 기준 40타면 100%
function finishPull() {
  const button = screen.getByRole('button', { name: '영차! 뽑기' });

  for (let index = 0; index < 40; index++) {
    fireEvent.pointerUp(button);
  }
}

function playPullToBufferFooter() {
  finishPull();
  clickButton('다음 ▸');
  clickButton('건너뛰기');
}

function hardEndGame() {
  act(() => {
    gameCanvas.enableNextStep();
  });
}

function clickButton(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}

describe('GamePage', () => {
  afterEach(() => {
    cleanup();
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

      expect(screen.getByRole('heading', { name: '냠냠… 없애는 중' })).toBeTruthy();
      expect(router.state.location.pathname).toBe(PATHS.game);
    });
  });

  describe('스크래치 진행 중', () => {
    it('"다음 ▸"은 비활성이고 "여기까지 할래요 ▸"는 활성 상태로 보인다', () => {
      enterScratchGame();

      expect(screen.getByRole('button', { name: '다음 ▸' }).hasAttribute('disabled')).toBe(true);
      expect(
        screen.getByRole('button', { name: '여기까지 할래요 ▸' }).hasAttribute('disabled'),
      ).toBe(false);
    });

    it('"여기까지 할래요 ▸"를 누르면 버퍼 없이 cleared:false로 /result에 간다', () => {
      const router = enterScratchGame();

      clickButton('여기까지 할래요 ▸');

      const { game } = useSessionStore.getState().steps;
      expect(game.completed).toBe(true);
      expect(game.data.cleared).toBe(false);
      expect(router.state.location.pathname).toBe(PATHS.result);
      expect(screen.queryByText('글자 다 지웠어요!')).toBeNull();
    });
  });

  describe('스크래치 하드 종료 후', () => {
    it('"다음 ▸"이 활성화되고 진행률이 100%로 표시된다', () => {
      enterScratchGame();

      hardEndGame();

      expect(screen.getByRole('button', { name: '다음 ▸' }).hasAttribute('disabled')).toBe(false);
      expect(screen.getByText(/100%/)).toBeTruthy();
    });

    it('자동으로 버퍼로 넘어가지 않는다', () => {
      enterScratchGame();

      hardEndGame();

      expect(screen.queryByText('글자 다 지웠어요!')).toBeNull();
      expect(screen.getByRole('heading', { name: '냠냠… 없애는 중' })).toBeTruthy();
    });

    it('"다음 ▸"을 누르면 게임이 사라지고 상단 "글자 다 지웠어요!" 버퍼가 /game에서 렌더된다', () => {
      const router = enterScratchGame();
      hardEndGame();

      clickButton('다음 ▸');

      expect(screen.getByText('글자 다 지웠어요!')).toBeTruthy();
      expect(screen.queryByRole('heading', { name: '냠냠… 없애는 중' })).toBeNull();
      expect(router.state.location.pathname).toBe(PATHS.game);
      expect(useSessionStore.getState().steps.game.completed).toBe(false);
    });

    it('버퍼 footer의 "다음 ▸"을 누르면 cleared:true로 /result에 간다', () => {
      const router = enterScratchGame();
      hardEndGame();
      clickButton('다음 ▸');
      clickButton('건너뛰기');

      clickButton('다음 ▸');

      const { game } = useSessionStore.getState().steps;
      expect(game.completed).toBe(true);
      expect(game.data.cleared).toBe(true);
      expect(router.state.location.pathname).toBe(PATHS.result);
    });
  });

  describe('당근 뽑기', () => {
    it('gameMode가 pull이면 뽑기 화면이 렌더되고 스크래치는 렌더되지 않는다', () => {
      enterPullGame();

      expect(screen.getByRole('heading', { name: '냠냠… 뽑는 중' })).toBeTruthy();
      expect(screen.queryByRole('heading', { name: '냠냠… 없애는 중' })).toBeNull();
    });

    it('완료 후 "다음 ▸"을 누르면 상단 "당근 다 뽑았어요!" 버퍼가 렌더된다', () => {
      enterPullGame();
      finishPull();

      clickButton('다음 ▸');

      expect(screen.getByText('당근 다 뽑았어요!')).toBeTruthy();
      expect(screen.queryByRole('heading', { name: '냠냠… 뽑는 중' })).toBeNull();
    });

    it('버퍼 footer의 "한 번 더 뽑기"를 누르면 replayCount가 늘고 게임이 0%로 다시 시작된다', () => {
      enterPullGame();
      playPullToBufferFooter();

      clickButton('한 번 더 뽑기');

      expect(useSessionStore.getState().steps.game.data.replayCount).toBe(1);
      expect(screen.getByRole('heading', { name: '냠냠… 뽑는 중' })).toBeTruthy();
      expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
    });

    it('다시 완료하면 버퍼가 처음부터 다시 재생된다', () => {
      enterPullGame();
      playPullToBufferFooter();
      clickButton('한 번 더 뽑기');
      finishPull();

      clickButton('다음 ▸');

      expect(screen.getByRole('button', { name: '건너뛰기' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: '한 번 더 뽑기' })).toBeNull();
    });

    it('3플레이를 마치면 "한 번 더 뽑기" 대신 유도 문구와 "다음 ▸"이 보인다', () => {
      enterPullGame();
      playPullToBufferFooter();
      clickButton('한 번 더 뽑기');
      playPullToBufferFooter();
      clickButton('한 번 더 뽑기');

      playPullToBufferFooter();

      expect(screen.queryByRole('button', { name: '한 번 더 뽑기' })).toBeNull();
      expect(screen.getByText('충분히 했어요. 이제 결과를 볼까요?')).toBeTruthy();
      expect(screen.getByRole('button', { name: '다음 ▸' })).toBeTruthy();
    });

    it('"여기까지 할래요 ▸"를 누르면 버퍼 없이 cleared:false로 /result에 간다', () => {
      const router = enterPullGame();

      clickButton('여기까지 할래요 ▸');

      const { game } = useSessionStore.getState().steps;
      expect(game.completed).toBe(true);
      expect(game.data.cleared).toBe(false);
      expect(router.state.location.pathname).toBe(PATHS.result);
      expect(screen.queryByText('당근 다 뽑았어요!')).toBeNull();
    });
  });

  describe('스크래치 버퍼 footer', () => {
    it('"한 번 더 뽑기" 없이 "다음 ▸"만 있다', () => {
      enterScratchGame();
      hardEndGame();
      clickButton('다음 ▸');

      clickButton('건너뛰기');

      expect(screen.queryByRole('button', { name: '한 번 더 뽑기' })).toBeNull();
      expect(screen.getByRole('button', { name: '다음 ▸' })).toBeTruthy();
    });
  });
});
