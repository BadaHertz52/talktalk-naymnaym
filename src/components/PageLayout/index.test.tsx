// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, act, waitFor, fireEvent } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { PATHS } from '@constants/paths';
import PageLayout from '.';
import { resetInitialLocationForTest } from './initialLocation';

function Heading({ name }: { name: string }) {
  return <h1>{name}</h1>;
}

function LateHeading() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 20);

    return () => clearTimeout(id);
  }, []);

  return ready ? <h1>늦은 제목</h1> : <p>로딩</p>;
}

function renderApp({ pageName }: { pageName?: string } = {}) {
  const router = createMemoryRouter(
    [
      {
        element: <PageLayout />,
        children: [{ path: PATHS.home, element: <Heading name="홈" /> }],
      },
      {
        element: <PageLayout showHeader pageName={pageName} />,
        children: [
          { path: PATHS.input, element: <Heading name="입력" /> },
          { path: PATHS.game, element: <LateHeading /> },
        ],
      },
    ],
    { initialEntries: [PATHS.home] },
  );
  render(<RouterProvider router={router} />);

  return router;
}

beforeEach(() => {
  resetInitialLocationForTest();
});

afterEach(() => {
  cleanup();
  document.title = '';
});

describe('PageLayout 라우트 변경 안내', () => {
  describe('라우트를 이동하면', () => {
    it('새 페이지 h1에 포커스가 가고 document.title이 바뀐다', async () => {
      const router = renderApp();

      await act(() => router.navigate(PATHS.input));

      expect(screen.getByRole('heading', { level: 1 })).toBe(document.activeElement);
      expect(document.title).toBe('감정 적기 — 톡톡냠냠');
    });
  });

  describe('첫 로드에서는', () => {
    it('포커스를 옮기지 않고 title만 설정한다', () => {
      renderApp();

      expect(document.activeElement).toBe(document.body);
      expect(document.title).toBe('톡톡냠냠');
    });
  });

  describe('최초 엔트리로 뒤로가기 복귀하면', () => {
    it('홈 h1에 포커스가 간다', async () => {
      const router = renderApp();
      await act(() => router.navigate(PATHS.input));

      await act(() => router.navigate(-1));

      const heading = screen.getByRole('heading', { level: 1, name: '홈' });
      expect(document.activeElement).toBe(heading);
    });
  });

  describe('헤더의 이전 페이지 버튼으로 이동하면', () => {
    it('이전 페이지 h1에 포커스가 간다', async () => {
      const router = renderApp();
      await act(() => router.navigate(PATHS.input));

      fireEvent.click(screen.getByRole('button', { name: '이전 페이지로 이동' }));

      await waitFor(() => expect(router.state.location.pathname).toBe(PATHS.home));
      const heading = screen.getByRole('heading', { level: 1, name: '홈' });
      expect(document.activeElement).toBe(heading);
    });
  });

  describe('모달이 열린 채 경로가 바뀌면', () => {
    it('dialog가 닫힌 뒤 새 페이지 h1에 포커스가 간다', async () => {
      const router = renderApp();
      const dialog = document.createElement('dialog');
      dialog.setAttribute('open', '');
      document.body.appendChild(dialog);
      await act(() => router.navigate(PATHS.input));
      expect(document.activeElement).toBe(document.body);

      dialog.removeAttribute('open');
      act(() => {
        dialog.dispatchEvent(new Event('close'));
      });

      expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }));
      dialog.remove();
    });
  });

  describe('pageName prop이 있으면', () => {
    it('document.title에 쓰인다', async () => {
      const router = renderApp({ pageName: '지정한 이름' });

      await act(() => router.navigate(PATHS.input));

      expect(document.title).toBe('지정한 이름 — 톡톡냠냠');
    });
  });

  describe('h1이 늦게 나타나면', () => {
    it('나타날 때 포커스된다', async () => {
      const router = renderApp();

      await act(() => router.navigate(PATHS.game));
      expect(screen.queryByRole('heading', { level: 1 })).toBeNull();

      const heading = await screen.findByRole('heading', { level: 1 });
      await waitFor(() => expect(document.activeElement).toBe(heading));
    });
  });

  describe('h1이 나타나기 전에 사용자가 포커스를 옮기면', () => {
    it('포커스를 빼앗지 않는다', async () => {
      const router = renderApp();
      await act(() => router.navigate(PATHS.game));
      const button = document.createElement('button');
      document.body.appendChild(button);

      act(() => button.focus());
      await screen.findByRole('heading', { level: 1 });

      expect(document.activeElement).toBe(button);
      button.remove();
    });
  });
});
