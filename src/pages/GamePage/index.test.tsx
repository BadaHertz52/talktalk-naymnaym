// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { useSessionStore } from '@stores/sessionStore';
import { PATHS } from '@constants/paths';

// Canvas·ResizeObserver를 쓰는 스크래치 로직은 jsdom에서 돌지 않고, 여기서는 진입 폴백만 검증한다
vi.mock('./_hooks/useGameCanvas', () => ({ useGameCanvas: () => ({ progress: 0 }) }));

const { default: GamePage } = await import('.');

function renderGamePage() {
  const router = createMemoryRouter(
    [
      { path: PATHS.measure, element: <div data-testid="measure-page" /> },
      { path: PATHS.game, element: <GamePage /> },
    ],
    { initialEntries: [PATHS.game] },
  );
  render(<RouterProvider router={router} />);

  return router;
}

describe('GamePage 진입 폴백', () => {
  afterEach(() => {
    cleanup();
  });

  it('gameMode 없이 /game에 접근하면 /measure로 리다이렉트된다', async () => {
    useSessionStore.getState().reset();

    const router = renderGamePage();

    expect(await screen.findByTestId('measure-page')).toBeTruthy();
    expect(router.state.location.pathname).toBe(PATHS.measure);
  });

  it('gameMode가 있으면 /game에 머문다', () => {
    useSessionStore.getState().reset();
    useSessionStore.getState().completeMeasure({ intensity: 5, gameMode: 'scratch' });

    const router = renderGamePage();

    expect(screen.getByRole('heading', { name: '냠냠… 없애는 중' })).toBeTruthy();
    expect(router.state.location.pathname).toBe(PATHS.game);
  });
});
