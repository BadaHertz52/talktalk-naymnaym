// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { useSessionStore } from '@stores/sessionStore';
import { PATHS } from '@constants/paths';
import ResultPage from '.';

const QUIT_MESSAGE = '시작한 것만으로도 오늘 몫은 했어요.';

function completeUntilGame({ cleared }: { cleared: boolean }) {
  useSessionStore.getState().reset();
  useSessionStore.getState().completeInput({ text: '속상해', secretMode: false });
  useSessionStore.getState().completeMeasure({ intensity: 4, gameMode: 'scratch' });
  useSessionStore.getState().completeGame({ cleared });
}

function renderResultPage() {
  const router = createMemoryRouter([{ path: PATHS.result, element: <ResultPage /> }], {
    initialEntries: [PATHS.result],
  });
  render(<RouterProvider router={router} />);
}

describe('ResultPage 종결 문구', () => {
  afterEach(() => {
    cleanup();
  });

  it('중도 이탈(cleared:false)로 들어오면 종결 문구가 보인다', () => {
    completeUntilGame({ cleared: false });

    renderResultPage();

    expect(screen.getByText(QUIT_MESSAGE)).toBeTruthy();
  });

  it('게임을 완료(cleared:true)하고 들어오면 종결 문구가 없다', () => {
    completeUntilGame({ cleared: true });

    renderResultPage();

    expect(screen.queryByText(QUIT_MESSAGE)).toBeNull();
  });
});
