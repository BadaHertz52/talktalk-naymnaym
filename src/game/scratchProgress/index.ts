import type { OnGameComplete, OnProgress } from '@/types/game';

export const DEFAULT_SCRATCH_COMPLETE_THRESHOLD = 0.8;

// 진행률 계산용 격자 샘플링 간격(px)
const SAMPLE_GRID_STEP = 16;

// alphaAt(x, y): 해당 좌표의 알파값(0~255, 0=완전 투명) 반환
export type AlphaSampler = (x: number, y: number) => number;

export interface CalculateErasedRatioOptions {
  alphaAt: AlphaSampler;
  width: number;
  height: number;
  gridStep?: number;
}

// 격자 샘플링으로 지워진 비율(0~1) 산출 — 알파가 낮을수록(투명할수록) 지워진 것
// width/height/gridStep이 유한 양수가 아니면 루프가 종료되지 않으므로(시스템 경계) 0을 반환한다
export function calculateErasedRatio({
  alphaAt,
  width,
  height,
  gridStep = SAMPLE_GRID_STEP,
}: CalculateErasedRatioOptions): number {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(gridStep) ||
    gridStep <= 0
  ) {
    return 0;
  }

  let sampled = 0;
  let erased = 0;

  for (let y = 0; y < height; y += gridStep) {
    for (let x = 0; x < width; x += gridStep) {
      sampled++;
      if (alphaAt(x, y) === 0) {
        erased++;
      }
    }
  }

  if (sampled === 0) {
    return 0;
  }

  return erased / sampled;
}

// 임계값 도달 시 onComplete를 정확히 1회만 호출하는 상태머신
export function createCompletionTracker(
  onComplete: OnGameComplete,
  threshold: number = DEFAULT_SCRATCH_COMPLETE_THRESHOLD,
): (ratio: number) => void {
  let completed = false;

  return (ratio: number) => {
    if (completed) {
      return;
    }

    if (ratio >= threshold) {
      completed = true;
      onComplete();
    }
  };
}

export interface ReportScratchProgressOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  onProgress: OnProgress;
  completionTracker: (ratio: number) => void;
  gridStep?: number;
}

/* ctx 의존 래퍼 — getImageData로 알파 샘플러를 만들고 진행률/완료 콜백을 호출*/
export function reportScratchProgress({
  ctx,
  width,
  height,
  onProgress,
  completionTracker,
  gridStep = SAMPLE_GRID_STEP,
}: ReportScratchProgressOptions): void {
  const { data } = ctx.getImageData(0, 0, width, height);
  const alphaAt: AlphaSampler = (x, y) => {
    const index = (Math.floor(y) * width + Math.floor(x)) * 4 + 3;

    return data[index] ?? 0;
  };

  const ratio = calculateErasedRatio({ alphaAt, width, height, gridStep });
  onProgress(ratio);
  completionTracker(ratio);
}
