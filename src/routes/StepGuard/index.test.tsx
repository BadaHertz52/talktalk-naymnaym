// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { useSessionStore } from '@stores/sessionStore';
import { PATHS } from '@constants/paths';

// 각 페이지는 GamePage(Canvas/ResizeObserver)·HomePage(마운트 시 reset 부작용) 등
// jsdom·테스트 흐름과 충돌하는 내부 구현을 갖고 있다. router.tsx의 실제 라우트 배선(단일 StepGuard가
// requires 배열로 여러 단계를 한번에 확인하는 구조)만 검증 대상이므로 페이지 컴포넌트는 testid만 렌더하는 스텁으로 교체한다.
// NotFoundPage는 그런 충돌이 없으므로 실제 컴포넌트를 그대로 렌더해 텍스트·버튼 동작까지 검증한다.
vi.mock('@pages/HomePage', () => ({ default: () => <div data-testid="home-page" /> }));
vi.mock('@pages/InputPage', () => ({ default: () => <div data-testid="input-page" /> }));
vi.mock('@pages/MeasurePage', () => ({ default: () => <div data-testid="measure-page" /> }));
vi.mock('@pages/GamePage', () => ({ default: () => <div data-testid="game-page" /> }));
vi.mock('@pages/ResultPage', () => ({ default: () => <div data-testid="result-page" /> }));
vi.mock('@pages/EndPage', () => ({ default: () => <div data-testid="end-page" /> }));

const { router } = await import('../router');

function resetSession() {
  useSessionStore.getState().reset();
}

function completeUpTo(step: 'input' | 'measure' | 'game' | 'result') {
  useSessionStore.getState().completeInput({ text: 'hi', secretMode: false });

  if (step === 'input') return;

  useSessionStore.getState().completeMeasure(5);

  if (step === 'measure') return;

  useSessionStore.getState().completeGame();

  if (step === 'game') return;

  useSessionStore.getState().completeResult({ intensityAfter: 2, afterEmotionText: 'done' });
}

function renderAt(path: string) {
  const memoryRouter = createMemoryRouter(router.routes, { initialEntries: [path] });

  render(<RouterProvider router={memoryRouter} />);

  return memoryRouter;
}

describe('router의 StepGuard 배선', () => {
  beforeEach(() => {
    resetSession();
  });

  afterEach(() => {
    cleanup();
  });

  describe('선행 단계 미완료 상태에서 접근하면 홈으로 리다이렉트된다', () => {
    it('input 미완료 상태로 /measure에 접근하면 홈으로 리다이렉트된다', async () => {
      renderAt(PATHS.measure);

      expect(await screen.findByTestId('home-page')).toBeTruthy();
    });

    it('measure 미완료 상태로 /game에 접근하면 홈으로 리다이렉트된다', async () => {
      completeUpTo('input');

      renderAt(PATHS.game);

      expect(await screen.findByTestId('home-page')).toBeTruthy();
    });

    it('measure 미완료 상태로 /result에 접근하면 requires 배열 중 measure 조건에 걸려 홈으로 리다이렉트된다', async () => {
      completeUpTo('input');

      renderAt(PATHS.result);

      expect(await screen.findByTestId('home-page')).toBeTruthy();
    });

    it('measure는 완료했지만 game 미완료 상태로 /result에 접근하면 requires 배열 중 game 조건에 걸려 홈으로 리다이렉트된다', async () => {
      completeUpTo('measure');

      renderAt(PATHS.result);

      expect(await screen.findByTestId('home-page')).toBeTruthy();
    });

    it('result 미완료 상태로 /end에 접근하면 홈으로 리다이렉트된다', async () => {
      completeUpTo('game');

      renderAt(PATHS.end);

      expect(await screen.findByTestId('home-page')).toBeTruthy();
    });
  });

  describe('선행 단계를 완료한 상태에서 접근하면 해당 페이지가 렌더된다', () => {
    it('input을 완료하면 /measure가 렌더된다', async () => {
      completeUpTo('input');

      renderAt(PATHS.measure);

      expect(await screen.findByTestId('measure-page')).toBeTruthy();
    });

    it('measure를 완료하면 /game이 렌더된다', async () => {
      completeUpTo('measure');

      renderAt(PATHS.game);

      expect(await screen.findByTestId('game-page')).toBeTruthy();
    });

    it('measure와 game을 모두 완료하면 /result가 렌더된다', async () => {
      completeUpTo('game');

      renderAt(PATHS.result);

      expect(await screen.findByTestId('result-page')).toBeTruthy();
    });

    it('result를 완료하면 /end가 렌더된다', async () => {
      completeUpTo('result');

      renderAt(PATHS.end);

      expect(await screen.findByTestId('end-page')).toBeTruthy();
    });
  });

  describe('가드가 없는 페이지', () => {
    it('완료 상태와 무관하게 /는 항상 렌더된다', async () => {
      completeUpTo('result');

      renderAt(PATHS.home);

      expect(await screen.findByTestId('home-page')).toBeTruthy();
    });

    it('완료 상태와 무관하게 /input은 항상 렌더된다', async () => {
      resetSession();

      renderAt(PATHS.input);

      expect(await screen.findByTestId('input-page')).toBeTruthy();
    });
  });

  describe('엣지 케이스', () => {
    it('모든 단계를 완료한 뒤 /measure로 재접근해도 completed 플래그만 확인하므로 정상 렌더된다', async () => {
      completeUpTo('result');

      renderAt(PATHS.measure);

      expect(await screen.findByTestId('measure-page')).toBeTruthy();
    });

    it('emotionText를 다른 값으로 재입력해 measure·game·result가 초기화된 상태로 /result에 접근하면 홈으로 리다이렉트된다', async () => {
      completeUpTo('result');

      useSessionStore.getState().completeInput({ text: 'changed', secretMode: false });
      renderAt(PATHS.result);

      expect(await screen.findByTestId('home-page')).toBeTruthy();
    });

    it('reset 이후 /game에 직접 접근하면 홈으로 리다이렉트된다', async () => {
      completeUpTo('result');
      resetSession();

      renderAt(PATHS.game);

      expect(await screen.findByTestId('home-page')).toBeTruthy();
    });

    it('reset 이후 /result에 직접 접근하면 홈으로 리다이렉트된다', async () => {
      completeUpTo('result');
      resetSession();

      renderAt(PATHS.result);

      expect(await screen.findByTestId('home-page')).toBeTruthy();
    });

    it('reset 이후 /end에 직접 접근하면 홈으로 리다이렉트된다', async () => {
      completeUpTo('result');
      resetSession();

      renderAt(PATHS.end);

      expect(await screen.findByTestId('home-page')).toBeTruthy();
    });

    it('완료 상태에서 뒤로가기(navigate(-1))로 이전 경로에 돌아가도 가드가 재평가되어 정상 렌더된다', async () => {
      completeUpTo('result');

      const memoryRouter = createMemoryRouter(router.routes, {
        initialEntries: [PATHS.home, PATHS.result],
        initialIndex: 1,
      });
      render(<RouterProvider router={memoryRouter} />);
      await screen.findByTestId('result-page');
      await memoryRouter.navigate(-1);

      expect(await screen.findByTestId('home-page')).toBeTruthy();
    });

    it('정의되지 않은 경로 접근 시 /not-found로 리다이렉트되어 NotFoundPage가 렌더된다', async () => {
      renderAt('/unknown');

      expect(await screen.findByRole('heading', { name: '404' })).toBeTruthy();
      expect(screen.getByRole('heading', { name: '페이지를 찾을 수 없어요.' })).toBeTruthy();
      expect(screen.queryByTestId('home-page')).toBeNull();
      expect(screen.queryByTestId('input-page')).toBeNull();
      expect(screen.queryByTestId('measure-page')).toBeNull();
      expect(screen.queryByTestId('game-page')).toBeNull();
      expect(screen.queryByTestId('result-page')).toBeNull();
      expect(screen.queryByTestId('end-page')).toBeNull();
    });

    it('/not-found에 직접 접근해도 NotFoundPage가 렌더된다', async () => {
      renderAt(PATHS.notFound);

      expect(await screen.findByRole('heading', { name: '404' })).toBeTruthy();
      expect(screen.getByRole('heading', { name: '페이지를 찾을 수 없어요.' })).toBeTruthy();
    });

    it('NotFoundPage에서 홈으로 돌아가기를 클릭하면 /로 이동하고 세션 상태는 변경되지 않는다', async () => {
      completeUpTo('result');

      renderAt('/unknown');

      const button = await screen.findByRole('button', { name: '홈으로 돌아가기' });
      fireEvent.click(button);

      expect(await screen.findByTestId('home-page')).toBeTruthy();
      expect(useSessionStore.getState().steps.result.completed).toBe(true);
    });
  });

  describe('ErrorPage', () => {
    it('렌더링 중 실제 에러를 던지는 라우트에 접근하면 ErrorPage의 일반 에러 UI가 렌더된다', async () => {
      const originalError = console.error;
      console.error = vi.fn();

      const memoryRouter = createMemoryRouter(
        [
          ...router.routes,
          {
            path: '/boom',
            element: <ThrowingComponent />,
            errorElement: router.routes[0]?.errorElement,
          },
        ],
        { initialEntries: ['/boom'] },
      );
      render(<RouterProvider router={memoryRouter} />);

      expect(await screen.findByRole('heading', { name: '문제가 발생했어요' })).toBeTruthy();
      expect(screen.queryByRole('heading', { name: '404' })).toBeNull();

      console.error = originalError;
    });
  });
});

function ThrowingComponent(): never {
  throw new Error('테스트용 렌더링 에러');
}
