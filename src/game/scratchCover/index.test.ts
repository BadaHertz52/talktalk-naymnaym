import { describe, it, expect, vi } from 'vitest';
import { wrapText, fitTextToCanvas, drawScratchCover } from '.';
import type { MeasureText } from '.';

const CHAR_WIDTH_RATIO = 0.6;

// 글자 수 × fontSize 비례로 폭을 흉내내는 mock measure 함수
const mockMeasure: MeasureText = (text, fontSize) => text.length * fontSize * CHAR_WIDTH_RATIO;

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

function linesFitWithinCanvas(
  lines: string[],
  fontSize: number,
  lineHeightRatio: number,
  height: number,
): boolean {
  return lines.length * fontSize * lineHeightRatio <= height;
}

describe('wrapText', () => {
  it('빈 문자열이면 빈 줄 하나를 반환한다', () => {
    const lines = wrapText({
      text: '',
      maxWidth: 300,
      fontSize: 20,
      measure: mockMeasure,
    });

    expect(lines).toEqual(['']);
  });

  it('개행 문자가 있으면 그 지점에서 줄이 나뉜다', () => {
    const lines = wrapText({
      text: '첫줄\n둘째줄',
      maxWidth: 300,
      fontSize: 20,
      measure: mockMeasure,
    });

    expect(lines).toEqual(['첫줄', '둘째줄']);
  });

  it('공백 없는 긴 한글 문자열은 음절 단위로 쪼개진다', () => {
    const longText = '가'.repeat(50);

    const lines = wrapText({
      text: longText,
      maxWidth: 100,
      fontSize: 20,
      measure: mockMeasure,
    });

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join('')).toBe(longText);
  });

  it('공백 포함 텍스트는 단어 단위로 줄바꿈된다', () => {
    const lines = wrapText({
      text: 'hello world foo bar',
      maxWidth: 100,
      fontSize: 20,
      measure: mockMeasure,
    });

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe('hello world foo bar');
  });
});

describe('fitTextToCanvas', () => {
  it('짧은 텍스트는 캔버스 높이 안에 들어간다', () => {
    const { fontSize, lineHeightRatio, lines } = fitTextToCanvas({
      text: '오늘 힘들었다',
      width: 390,
      height: 400,
      measure: mockMeasure,
    });

    expect(linesFitWithinCanvas(lines, fontSize, lineHeightRatio, 400)).toBe(true);
  });

  it('1000자 텍스트도 캔버스 높이 안에 들어간다', () => {
    const longText = '오늘 정말 힘든 하루였다. '.repeat(80).slice(0, 1000);

    const { fontSize, lineHeightRatio, lines } = fitTextToCanvas({
      text: longText,
      width: 390,
      height: 600,
      measure: mockMeasure,
    });

    expect(linesFitWithinCanvas(lines, fontSize, lineHeightRatio, 600)).toBe(true);
  });

  it('공백 없는 긴 한글 문자열도 캔버스 높이 안에 들어간다', () => {
    const longText = '가'.repeat(1000);

    const { fontSize, lineHeightRatio, lines } = fitTextToCanvas({
      text: longText,
      width: 390,
      height: 600,
      measure: mockMeasure,
    });

    expect(linesFitWithinCanvas(lines, fontSize, lineHeightRatio, 600)).toBe(true);
  });

  it('개행이 포함된 텍스트도 캔버스 높이 안에 들어간다', () => {
    const longText = Array.from({ length: 30 }, (_, i) => `줄바꿈 테스트 ${i}`).join('\n');

    const { fontSize, lineHeightRatio, lines } = fitTextToCanvas({
      text: longText,
      width: 390,
      height: 600,
      measure: mockMeasure,
    });

    expect(linesFitWithinCanvas(lines, fontSize, lineHeightRatio, 600)).toBe(true);
    expect(lines.length).toBeGreaterThanOrEqual(30);
  });

  it('빈 문자열이면 최소 폰트 크기로도 캔버스 높이 안에 들어간다', () => {
    const { fontSize, lineHeightRatio, lines, truncated } = fitTextToCanvas({
      text: '',
      width: 390,
      height: 600,
      measure: mockMeasure,
    });

    expect(linesFitWithinCanvas(lines, fontSize, lineHeightRatio, 600)).toBe(true);
    expect(truncated).toBe(false);
  });

  it('정상 케이스에서는 truncated가 false다', () => {
    const { truncated } = fitTextToCanvas({
      text: '오늘 힘들었다',
      width: 390,
      height: 400,
      measure: mockMeasure,
    });

    expect(truncated).toBe(false);
  });

  it('극단적으로 좁은 캔버스에서 긴 텍스트는 높이 안에 들어가도록 잘리고 말줄임 처리된다', () => {
    const longText = '가'.repeat(1000);

    const { fontSize, lineHeightRatio, lines, truncated } = fitTextToCanvas({
      text: longText,
      width: 20,
      height: 30,
      measure: mockMeasure,
    });

    expect(linesFitWithinCanvas(lines, fontSize, lineHeightRatio, 30)).toBe(true);
    expect(linesFitWithinCanvas(lines, fontSize, lineHeightRatio, 30)).toBe(true);
    expect(lines[lines.length - 1].endsWith('…')).toBe(true);
    expect(truncated).toBe(true);
  });
});

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
