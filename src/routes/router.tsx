import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { StepGuard } from './StepGuard';
import PageLayout from '@components/PageLayout';
import { PATHS } from '@constants/paths';
import HomePage from '@pages/HomePage';
import InputPage from '@pages/InputPage';
import MeasurePage from '@pages/MeasurePage';
import ResultPage from '@pages/ResultPage';
import EndPage from '@pages/EndPage';

// Canvas 게임 로직(src/game/)이 딸려 있어 별도 청크로 분리 — GamePage 진입 전에는 받지 않는다
const GamePage = lazy(() => import('@pages/GamePage'));

export const router = createBrowserRouter([
  {
    element: <PageLayout />,
    children: [{ path: PATHS.home, element: <HomePage /> }],
  },
  {
    element: <PageLayout showHeader />,
    children: [
      { path: PATHS.input, element: <InputPage /> },
      {
        element: <StepGuard requires="input" />,
        children: [{ path: PATHS.measure, element: <MeasurePage /> }],
      },
      {
        element: <StepGuard requires="measure" />,
        children: [
          {
            path: PATHS.game,
            element: (
              <Suspense fallback={null}>
                <GamePage />
              </Suspense>
            ),
          },
        ],
      },
      {
        element: <StepGuard requires="measure" />,
        children: [
          {
            element: <StepGuard requires="game" />,
            children: [{ path: PATHS.result, element: <ResultPage /> }],
          },
        ],
      },
      {
        element: <StepGuard requires="result" />,
        children: [{ path: PATHS.end, element: <EndPage /> }],
      },
    ],
  },
]);
