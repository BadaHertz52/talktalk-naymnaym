import { createBrowserRouter } from 'react-router-dom'
import { StepGuard } from './StepGuard'
import HomePage from '../pages/HomePage'
import InputPage from '../pages/InputPage'
import MeasurePage from '../pages/MeasurePage'
import GamePage from '../pages/GamePage'
import ResultPage from '../pages/ResultPage'
import EndPage from '../pages/EndPage'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/input', element: <InputPage /> },
  {
    element: <StepGuard requires="input" />,
    children: [{ path: '/measure', element: <MeasurePage /> }],
  },
  {
    element: <StepGuard requires="measure" />,
    children: [{ path: '/game', element: <GamePage /> }],
  },
  {
    element: <StepGuard requires="game" />,
    children: [{ path: '/result', element: <ResultPage /> }],
  },
  {
    element: <StepGuard requires="result" />,
    children: [{ path: '/end', element: <EndPage /> }],
  },
])
