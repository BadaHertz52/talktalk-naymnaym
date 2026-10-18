import { describe, it, expect, vi } from 'vitest';
import { drawScratchCover } from '.';

const CHAR_WIDTH_RATIO = 0.6;

// drawScratchCover가 호출하는 CanvasRenderingContext2D API만 흉내내는 mock ctx
function createMockCtx() {
  return {
    imageSmoothingEnabled: false,
    fillStyle: '',
    font: '',
    textAlign: 'center',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: (text: string) => ({ width: text.length * CHAR_WIDTH_RATIO * 10 }),
    save: vi.fn(),
    restore: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('drawScratchCover', () => {
  describe('secretMode가 true면', () => {
    it('실제 글자를 그리지 않고 공백이 아닌 구간에만 밑줄(fillRect)을 그린다', () => {
      const ctx = createMockCtx();

      drawScratchCover(ctx, { text: '오늘 힘들었다', width: 300, height: 200, secretMode: true });

      expect(ctx.fillText).not.toHaveBeenCalled();
      // 배경 사각형(1) + 비공백 세그먼트 2개(오늘, 힘들었다) = 3
      expect(ctx.fillRect).toHaveBeenCalledTimes(3);
    });

    it('공백만 있는 텍스트는 배경만 그리고 밑줄은 그리지 않는다', () => {
      const ctx = createMockCtx();

      drawScratchCover(ctx, { text: '  ', width: 300, height: 200, secretMode: true });

      expect(ctx.fillRect).toHaveBeenCalledTimes(1);
    });
  });

  describe('secretMode가 false면', () => {
    it('기존과 동일하게 줄 단위로 fillText를 호출한다', () => {
      const ctx = createMockCtx();

      drawScratchCover(ctx, { text: '오늘 힘들었다', width: 300, height: 200 });

      expect(ctx.fillText).toHaveBeenCalledTimes(1);
      expect(ctx.fillRect).toHaveBeenCalledTimes(1);
    });
  });
});
