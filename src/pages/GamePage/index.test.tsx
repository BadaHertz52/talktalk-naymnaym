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
      expect(screen.getByRole('button', { name: '여기까지 할래요 ▸' }).hasAttribute('disabled')).toBe(
        false,
      );
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
});
