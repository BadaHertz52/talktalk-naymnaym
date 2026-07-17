import type { OnProgress, Position } from '@/types/game';
import { drawScratchCover } from '@game/scratchCover';
import { eraseStroke, getBrushRadius, clampToCanvas } from '@game/scratchEraser';
import { reportScratchProgress, createCompletionTracker } from '@game/scratchProgress';

// 진행률 계산(getImageData)이 매 pointermove/키 입력마다 돌지 않도록 최소 호출 간격을 둔다
const PROGRESS_THROTTLE_MS = 80;
// 키보드 화살표 1회 입력당 이동 거리(px, CSS 기준) — 브러시 반경의 절반 정도로 자연스럽게 지워지게
const KEYBOARD_STEP = 16;

const KEY_DELTA: Record<string, Position> = {
  ArrowUp: { x: 0, y: -KEYBOARD_STEP },
  ArrowDown: { x: 0, y: KEYBOARD_STEP },
  ArrowLeft: { x: -KEYBOARD_STEP, y: 0 },
  ArrowRight: { x: KEYBOARD_STEP, y: 0 },
};

export interface CreateScratchControllerOptions {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  emotionText: string;
  enableNextStep: () => void;
  onProgress: OnProgress;
  cursorRef: { current: Position | null };
  onCursorMove: (pos: Position) => void;
}

export interface ScratchController {
  resize: () => void;
  handlePointerDown: (e: PointerEvent) => void;
  handlePointerMove: (e: PointerEvent) => void;
  handlePointerUp: () => void;
  handleKeyDown: (e: KeyboardEvent) => void;
}

/* 스크래치 캔버스의 리사이즈/포인터/키보드 상호작용을 하나로 묶은 컨트롤러 */
export function createScratchController({
  canvas,
  ctx,
  emotionText,
  enableNextStep,
  onProgress,
  cursorRef,
  onCursorMove,
}: CreateScratchControllerOptions): ScratchController {
  // 리사이즈/회전 시 갱신되는 최신 CSS 크기 — clampToCanvas/getBrushRadius/키보드 이동이 항상 이 값을 참조한다
  const size = { width: 0, height: 0 };
  const completionTracker = createCompletionTracker(enableNextStep);
  let lastProgressAt = 0;

  const resize = () => {
    const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    size.width = cssWidth;
    size.height = cssHeight;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 리사이즈 시 지운 진행 상태 보존은 하지 않는다 — 드문 이벤트라 좌표 정합성이 더 중요 (ponytail: 리사이즈 빈도가 문제되면 진행률 보존 재검토)
    drawScratchCover(ctx, { text: emotionText, width: cssWidth, height: cssHeight });
  };

  const reportProgressThrottled = () => {
    const now = performance.now();

    if (now - lastProgressAt < PROGRESS_THROTTLE_MS) {
      return;
    }
    lastProgressAt = now;

    // getImageData는 실제 픽셀 버퍼(dpr 반영) 기준이라 canvas.width/height를 사용한다
    reportScratchProgress({
      ctx,
      width: canvas.width,
      height: canvas.height,
      onProgress,
      completionTracker,
    });
  };

  const eraseTo = (pos: Position) => {
    const from = cursorRef.current ?? pos;

    eraseStroke({ ctx, from, to: pos, radius: getBrushRadius(size.width) });
    cursorRef.current = pos;
    // 당근이 부드럽게 따라다니도록 진행률과 달리 스로틀 없이 매 이동마다 알린다
    onCursorMove(pos);
    reportProgressThrottled();
  };

  const toCanvasPos = (clientX: number, clientY: number): Position => {
    const rect = canvas.getBoundingClientRect();

    return clampToCanvas({
      pos: { x: clientX - rect.left, y: clientY - rect.top },
      width: size.width,
      height: size.height,
    });
  };

  const handlePointerDown = (e: PointerEvent) => {
    canvas.setPointerCapture(e.pointerId);
    cursorRef.current = toCanvasPos(e.clientX, e.clientY);
    eraseTo(toCanvasPos(e.clientX, e.clientY));
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (e.buttons === 0) {
      return;
    }
    eraseTo(toCanvasPos(e.clientX, e.clientY));
  };

  const handlePointerUp = () => {
    cursorRef.current = null;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const delta = KEY_DELTA[e.key];

    if (!delta) {
      return;
    }
    e.preventDefault();

    const current = cursorRef.current ?? { x: size.width / 2, y: size.height / 2 };
    const next = clampToCanvas({
      pos: { x: current.x + delta.x, y: current.y + delta.y },
      width: size.width,
      height: size.height,
    });

    eraseTo(next);
  };

  return { resize, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown };
}
