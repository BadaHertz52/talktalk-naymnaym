import { describe, it, expect } from 'vitest';
import { wrapText, fitTextToCanvas } from '.';
import type { MeasureText } from '.';

const CHAR_WIDTH_RATIO = 0.6;

// 글자 수 × fontSize 비례로 폭을 흉내내는 mock measure 함수
const mockMeasure: MeasureText = (text, fontSize) => text.length * fontSize * CHAR_WIDTH_RATIO;

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
