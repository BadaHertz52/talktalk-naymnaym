import { useEffect, useRef, useState, type RefObject } from 'react';
import type { OnGameComplete, Position } from '@/types/game';
import { createScratchController } from '@game/scratchController';

interface UseGameCanvasResult {
  progress: number;
}

export function useGameCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  emotionText: string,
  onComplete: OnGameComplete,
): UseGameCanvasResult {
  const [progress, setProgress] = useState(0);
  const cursorRef = useRef<Position | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const controller = createScratchController({
      canvas,
      ctx,
      emotionText,
      onComplete,
      onProgress: setProgress,
      cursorRef,
    });

    controller.resize();

    const resizeObserver = new ResizeObserver(controller.resize);
    resizeObserver.observe(canvas);

    canvas.addEventListener('pointerdown', controller.handlePointerDown);
    canvas.addEventListener('pointermove', controller.handlePointerMove);
    canvas.addEventListener('pointerup', controller.handlePointerUp);
    canvas.addEventListener('pointercancel', controller.handlePointerUp);
    canvas.addEventListener('keydown', controller.handleKeyDown);

    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', controller.handlePointerDown);
      canvas.removeEventListener('pointermove', controller.handlePointerMove);
      canvas.removeEventListener('pointerup', controller.handlePointerUp);
      canvas.removeEventListener('pointercancel', controller.handlePointerUp);
      canvas.removeEventListener('keydown', controller.handleKeyDown);
    };
  }, [canvasRef, emotionText, onComplete]);

  return { progress };
}
