import type { RefObject } from 'react';
import type { OnGameComplete } from '@/types/game';

// ponytail: body empty — full impl in Phase 3 issue #12
export function useGameCanvas(
  _canvasRef: RefObject<HTMLCanvasElement | null>,
  _emotionText: string,
  _onComplete: OnGameComplete,
): void {}
