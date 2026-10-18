// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { eraseStroke } from '@game/scratchEraser';
import { createScratchController } from '.';

vi.mock('@game/scratchCover', () => ({ drawScratchCover: vi.fn() }));
vi.mock('@game/scratchEraser', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@game/scratchEraser')>()),
  eraseStroke: vi.fn(),
}));

const SIZE = 64;

// 스로틀(80ms)이 "이후 입력 무시"를 대신 증명해버리지 않도록 호출마다 시간을 충분히 흘린다
function stubAdvancingClock() {
  let now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => (now += 1000));
}

// alpha가 전부 0인 픽셀 버퍼 → 첫 진행률 보고에서 곧바로 100%(임계값 70% 이상)가 된다
function setupController() {
  const canvas = {
    width: 0,
    height: 0,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: SIZE, height: SIZE }),
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    hasPointerCapture: vi.fn(() => true),
  };
  const ctx = {
    setTransform: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
    })),
  };
  const enableNextStep = vi.fn();
  const onProgress = vi.fn();
  const onCursorMove = vi.fn();
  const cursorRef: { current: { x: number; y: number } | null } = { current: null };
  const controller = createScratchController({
    canvas: canvas as unknown as HTMLCanvasElement,
    ctx: ctx as unknown as CanvasRenderingContext2D,
    emotionText: '테스트',
    secretMode: false,
    enableNextStep,
    onProgress,
    cursorRef,
    onCursorMove,
  });
  controller.resize();

  return { controller, canvas, enableNextStep, onProgress, onCursorMove, cursorRef };
}

function pointer(type: string, { x = 10, y = 10, buttons = 1 } = {}) {
  return { type, pointerId: 7, clientX: x, clientY: y, buttons } as unknown as PointerEvent;
}

function completeByPointerDown(controller: ReturnType<typeof setupController>['controller']) {
  controller.handlePointerDown(pointer('pointerdown'));
}

describe('createScratchController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(eraseStroke).mockClear();
  });

  describe('진행률이 70%에 도달하면', () => {
    it('enableNextStep이 1회 호출되고 이후 입력에도 다시 호출되지 않는다', () => {
      stubAdvancingClock();
      const { controller, enableNextStep } = setupController();

      completeByPointerDown(controller);
      controller.handlePointerMove(pointer('pointermove', { x: 30, y: 30 }));
      controller.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      expect(enableNextStep).toHaveBeenCalledTimes(1);
    });

    it('이후 pointer·keyboard 입력은 캔버스를 지우지 않고 진행률·커서도 바꾸지 않는다', () => {
      stubAdvancingClock();
      const { controller, onProgress, onCursorMove } = setupController();
      completeByPointerDown(controller);
      const erasedBefore = vi.mocked(eraseStroke).mock.calls.length;
      const progressBefore = onProgress.mock.calls.length;
      const cursorBefore = onCursorMove.mock.calls.length;

      controller.handlePointerDown(pointer('pointerdown', { x: 40, y: 40 }));
      controller.handlePointerMove(pointer('pointermove', { x: 50, y: 50 }));
      controller.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));

      expect(vi.mocked(eraseStroke).mock.calls.length).toBe(erasedBefore);
      expect(onProgress.mock.calls.length).toBe(progressBefore);
      expect(onCursorMove.mock.calls.length).toBe(cursorBefore);
    });

    it('하드 종료 시점에 pointer capture가 1회 해제되고 커서가 초기화된다', () => {
      stubAdvancingClock();
      const { controller, canvas, cursorRef } = setupController();

      completeByPointerDown(controller);

      expect(canvas.releasePointerCapture).toHaveBeenCalledTimes(1);
      expect(canvas.releasePointerCapture).toHaveBeenCalledWith(7);
      expect(cursorRef.current).toBeNull();
    });
  });

  describe('진행률이 70% 미만이면', () => {
    it('pointer capture를 해제하지 않고 입력이 계속 캔버스를 지운다', () => {
      // 시간이 흐르지 않으면 진행률 보고가 스로틀돼 완료에 도달하지 않는다
      vi.spyOn(performance, 'now').mockReturnValue(0);
      const { controller, canvas } = setupController();

      controller.handlePointerDown(pointer('pointerdown'));
      controller.handlePointerMove(pointer('pointermove', { x: 30, y: 30 }));

      expect(canvas.releasePointerCapture).not.toHaveBeenCalled();
      expect(vi.mocked(eraseStroke)).toHaveBeenCalledTimes(2);
    });
  });
});
