import { createBrowserRouter } from 'react-router-dom';
import { StepGuard } from './StepGuard';
import PageLayout from '@components/PageLayout';
import { PATHS } from '@constants/paths';
import HomePage from '@pages/HomePage';
import InputPage from '@pages/InputPage';
import MeasurePage from '@pages/MeasurePage';
import GamePage from '@pages/GamePage';
import ResultPage from '@pages/ResultPage';
import EndPage from '@pages/EndPage';
import NotFoundPage from '@pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    errorElement: <NotFoundPage />,
    children: [
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
            children: [{ path: PATHS.game, element: <GamePage /> }],
          },
          {
            element: <StepGuard requires="game" />,
                children: [{ path: PATHS.result, element: <ResultPage /> }],
              },
          {
            element: <StepGuard requires="result" />,
            children: [{ path: PATHS.end, element: <EndPage /> }],
          },
        ],
      },
    ],
  },
]);
