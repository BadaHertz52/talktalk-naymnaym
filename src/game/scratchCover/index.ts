// 계약: 호출자가 텍스트를 최대 1000자로 제한하는 것을 전제로 한다 (InputPage 입력 제한과 연동).
// 그 이상 길이는 fitTextToCanvas가 극단 축소/말줄임으로 방어하지만 성능 검증 대상은 아니다.

import type { ScratchCoverOptions } from '@/types/game';

const COVER_GRADIENT_TOP = '#2a2a2a';
const COVER_GRADIENT_BOTTOM = '#0a0a0a';
const COVER_TEXT_COLOR = '#e0e0e0';
const COVER_FONT_FAMILY = "'Galmuri14', 'Galmuri11', 'Courier New', monospace";

const MAX_FONT_SIZE = 48;
const MIN_FONT_SIZE = 10;
const LINE_HEIGHT_RATIO = 1.4;
const MIN_LINE_HEIGHT_RATIO = 1.05;
const HORIZONTAL_PADDING_RATIO = 0.08;
// 텍스트 블록이 캔버스를 꽉 채우지 않도록 상한을 둔다 — 시각적 여백 확보용
const TEXT_AREA_MAX_HEIGHT_RATIO = 0.8;

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

const ELLIPSIS = '…';

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

/**
 * Canvas 2D 컨텍스트에 어두운 그라데이션 배경 + 감정 텍스트 커버를 그린다.
 */
export function drawScratchCover(
  ctx: CanvasRenderingContext2D,
  options: ScratchCoverOptions,
): void {
  const { text, width, height, textOpacity = 0.2 } = options;

  ctx.imageSmoothingEnabled = false;

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COVER_GRADIENT_TOP);
  gradient.addColorStop(1, COVER_GRADIENT_BOTTOM);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const measure: MeasureText = (measuredText, fontSize) => {
    ctx.font = `${fontSize}px ${COVER_FONT_FAMILY}`;

    return ctx.measureText(measuredText).width;
  };

  // 폰트 크기 산출은 80% 높이 제약으로 하되, 실제 배치는 전체 height 기준 중앙 정렬을 유지한다
  const { fontSize, lineHeightRatio, lines } = fitTextToCanvas({
    text,
    width,
    height: height * TEXT_AREA_MAX_HEIGHT_RATIO,
    measure,
  });
  const lineHeight = fontSize * lineHeightRatio;
  const totalTextHeight = lines.length * lineHeight;

  ctx.font = `${fontSize}px ${COVER_FONT_FAMILY}`;
  ctx.fillStyle = COVER_TEXT_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const startY = (height - totalTextHeight) / 2 + lineHeight / 2;

  ctx.save();
  ctx.globalAlpha = textOpacity;
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight);
  });
  ctx.restore();
}
