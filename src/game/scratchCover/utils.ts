import {
  ELLIPSIS,
  HORIZONTAL_PADDING_RATIO,
  LINE_HEIGHT_RATIO,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  MIN_LINE_HEIGHT_RATIO,
} from './constants';

export type MeasureText = (text: string, fontSize: number) => number;

interface WrapTextOptions {
  text: string;
  maxWidth: number;
  fontSize: number;
  measure: MeasureText;
}

/**
 * 텍스트를 폭 안에 들어가도록 줄바꿈한다.
 * 개행 문자는 그대로 존중하고, 공백 단위로 먼저 나눈 뒤 안 들어가면 음절 단위로 쪼갠다(한글 대응).
 */
export function wrapText({ text, maxWidth, fontSize, measure }: WrapTextOptions): string[] {
  if (text === '') {
    return [''];
  }

  const lines: string[] = [];

  for (const paragraph of text.split('\n')) {
    if (paragraph === '') {
      lines.push('');
      continue;
    }

    let currentLine = '';

    for (const word of paragraph.split(' ')) {
      const candidate = currentLine === '' ? word : `${currentLine} ${word}`;

      if (measure(candidate, fontSize) <= maxWidth) {
        currentLine = candidate;
        continue;
      }

      if (currentLine !== '') {
        lines.push(currentLine);
        currentLine = '';
      }

      // 단어 자체가 폭을 넘으면 음절(글자) 단위로 쪼갠다
      let chunk = '';
      for (const char of word) {
        const nextChunk = chunk + char;
        if (chunk !== '' && measure(nextChunk, fontSize) > maxWidth) {
          lines.push(chunk);
          chunk = char;
        } else {
          chunk = nextChunk;
        }
      }
      currentLine = chunk;
    }

    lines.push(currentLine);
  }

  return lines;
}

interface FitResult {
  fontSize: number;
  lineHeightRatio: number;
  lines: string[];
  truncated: boolean;
}

interface TruncateToHeightOptions {
  lines: string[];
  fontSize: number;
  lineHeightRatio: number;
  height: number;
}

/*height 안에 들어가는 줄 수까지만 자르고 마지막 표시 줄 끝에 ELLIPSIS를 붙이는 함수 */
function truncateToHeight({
  lines,
  fontSize,
  lineHeightRatio,
  height,
}: TruncateToHeightOptions): string[] {
  const maxLines = Math.max(1, Math.floor(height / (fontSize * lineHeightRatio)));

  if (lines.length <= maxLines) {
    return lines;
  }

  const visible = lines.slice(0, maxLines);
  const lastIndex = visible.length - 1;
  visible[lastIndex] = `${visible[lastIndex]}${ELLIPSIS}`;

  return visible;
}

interface FitTextToCanvasOptions {
  text: string;
  width: number;
  height: number;
  measure: MeasureText;
}
/**
 * 캔버스 크기 안에 텍스트 전체가 들어가는 최대 폰트 크기를 이진 탐색으로 찾는다.
 * 최소 폰트 크기에서도 넘치면 줄 간격을 축소해 대응하고, 그래도 넘치면 말줄임(ellipsis) 처리한다.
 */
export function fitTextToCanvas({
  text,
  width,
  height,
  measure,
}: FitTextToCanvasOptions): FitResult {
  const maxWidth = width * (1 - HORIZONTAL_PADDING_RATIO * 2);
  const fits = (fontSize: number, lineHeightRatio: number): { ok: boolean; lines: string[] } => {
    const lines = wrapText({ text, maxWidth, fontSize, measure });
    const totalHeight = lines.length * fontSize * lineHeightRatio;

    return { ok: totalHeight <= height, lines };
  };

  let low = MIN_FONT_SIZE;
  let high = MAX_FONT_SIZE;
  let best = fits(MIN_FONT_SIZE, LINE_HEIGHT_RATIO);

  if (!best.ok) {
    // 최소 크기에서도 넘치면 줄 간격을 축소해 한 번 더 시도
    best = fits(MIN_FONT_SIZE, MIN_LINE_HEIGHT_RATIO);

    if (!best.ok) {
      // 그래도 넘치면 들어가는 줄 수까지만 자르고 말줄임 처리
      const truncatedLines = truncateToHeight({
        lines: best.lines,
        fontSize: MIN_FONT_SIZE,
        lineHeightRatio: MIN_LINE_HEIGHT_RATIO,
        height,
      });

      return {
        fontSize: MIN_FONT_SIZE,
        lineHeightRatio: MIN_LINE_HEIGHT_RATIO,
        lines: truncatedLines,
        truncated: true,
      };
    }

    return {
      fontSize: MIN_FONT_SIZE,
      lineHeightRatio: MIN_LINE_HEIGHT_RATIO,
      lines: best.lines,
      truncated: false,
    };
  }

  while (low < high) {
    const mid = Math.ceil((low + high + 1) / 2);
    const result = fits(mid, LINE_HEIGHT_RATIO);

    if (result.ok) {
      best = result;
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return { fontSize: low, lineHeightRatio: LINE_HEIGHT_RATIO, lines: best.lines, truncated: false };
}
