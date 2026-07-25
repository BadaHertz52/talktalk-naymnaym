import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Position } from '@/types/game';
import { createScratchController } from '@game/scratchController';

interface UseGameCanvasResult {
  progress: number;
}

interface UseGameCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  carrotRef: RefObject<HTMLImageElement | null>;
  emotionText: string;
  enableNextStep: () => void;
}

export function useGameCanvas({
  canvasRef,
  carrotRef,
  emotionText,
  enableNextStep,
}: UseGameCanvasProps): UseGameCanvasResult {
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
      enableNextStep,
      onProgress: setProgress,
      cursorRef,
      onCursorMove: (pos) => {
        const carrot = carrotRef.current;

        if (!carrot) {
          return;
        }

        carrot.style.left = `${pos.x}px`;
        carrot.style.top = `${pos.y}px`;
      },
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
  }, [canvasRef, carrotRef, emotionText, enableNextStep]);

  return { progress };
}
