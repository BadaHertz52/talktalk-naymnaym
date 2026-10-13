// 계약: 호출자가 텍스트를 최대 1000자로 제한하는 것을 전제로 한다 (InputPage 입력 제한과 연동).
// 그 이상 길이는 fitTextToCanvas가 극단 축소/말줄임으로 방어하지만 성능 검증 대상은 아니다.

import type { ScratchCoverOptions } from '@/types/game';
import { getMaskSegments } from '@utils/secretMask';
import {
  COVER_FONT_FAMILY,
  COVER_GRADIENT_BOTTOM,
  COVER_GRADIENT_TOP,
  COVER_TEXT_COLOR,
  SECRET_UNDERLINE_MIN_THICKNESS,
  SECRET_UNDERLINE_OFFSET_RATIO,
  SECRET_UNDERLINE_THICKNESS_RATIO,
  TEXT_AREA_MAX_HEIGHT_RATIO,
} from './constants';
import { fitTextToCanvas } from './utils';
import type { MeasureText } from './utils';

/**
 * Canvas 2D 컨텍스트에 어두운 그라데이션 배경 + 감정 텍스트 커버를 그린다.
 */
export function drawScratchCover(
  ctx: CanvasRenderingContext2D,
  options: ScratchCoverOptions,
): void {
  const { text, width, height, textOpacity = 0.2, secretMode = false } = options;

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
  ctx.textBaseline = 'middle';

  const startY = (height - totalTextHeight) / 2 + lineHeight / 2;

  ctx.save();

  if (secretMode) {
    // 실제 글자는 그리지 않고, 공백이 아닌 구간 아래에만 밑줄을 그린다 (InputPage와 동일한 마스킹 규칙)
    ctx.textAlign = 'left';

    const underlineThickness = Math.max(
      SECRET_UNDERLINE_MIN_THICKNESS,
      fontSize * SECRET_UNDERLINE_THICKNESS_RATIO,
    );

    lines.forEach((line, index) => {
      const lineWidth = measure(line, fontSize);
      const lineY = startY + index * lineHeight;
      let x = width / 2 - lineWidth / 2;

      for (const segment of getMaskSegments(line, true)) {
        const segmentWidth = measure(segment.text, fontSize);

        if (segment.masked) {
          ctx.fillRect(
            x,
            lineY + fontSize * SECRET_UNDERLINE_OFFSET_RATIO,
            segmentWidth,
            underlineThickness,
          );
        }
        x += segmentWidth;
      }
    });
  } else {
    ctx.textAlign = 'center';
    ctx.globalAlpha = textOpacity;
    lines.forEach((line, index) => {
      ctx.fillText(line, width / 2, startY + index * lineHeight);
    });
  }

  ctx.restore();
}
