import { createBrowserRouter } from 'react-router-dom';
import { StepGuard } from './StepGuard';
import PageLayout from '../components/PageLayout';
import { PATHS } from '../constants/paths';
import HomePage from '../pages/HomePage';
import InputPage from '../pages/InputPage';
import MeasurePage from '../pages/MeasurePage';
import GamePage from '../pages/GamePage';
import ResultPage from '../pages/ResultPage';
import EndPage from '../pages/EndPage';

export const router = createBrowserRouter([
  {
    element: <PageLayout />,
    children: [
      { path: PATHS.home, element: <HomePage /> },
      { path: PATHS.end, element: <EndPage /> },
    ],
  },
  {
    element: <PageLayout step="01 / 04" />,
    children: [{ path: PATHS.input, element: <InputPage /> }],
  },
  {
    element: <PageLayout step="02 / 04" />,
    children: [
      {
        element: <StepGuard requires="input" />,
        children: [{ path: PATHS.measure, element: <MeasurePage /> }],
      },
    ],
  },
  {
    element: <PageLayout step="03 / 04" />,
    children: [
      {
        element: <StepGuard requires="measure" />,
        children: [{ path: PATHS.game, element: <GamePage /> }],
      },
    ],
  },
  {
    element: <PageLayout step="04 / 04" />,
    children: [
      {
        element: <StepGuard requires="game" />,
        children: [{ path: PATHS.result, element: <ResultPage /> }],
      },
    ],
  },
]);
