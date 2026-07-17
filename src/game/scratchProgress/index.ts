import type { OnGameComplete, OnProgress } from '@/types/game';

export const DEFAULT_SCRATCH_COMPLETE_THRESHOLD = 0.9;

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

// ctx 의존 래퍼 — getImageData로 알파 샘플러를 만들고 진행률/완료 콜백을 호출
//
// 호출당 getImageData(0, 0, width, height)로 캔버스 전체를 읽는 비용이 존재한다(dpr 반영 시 4배 이상).
// 검토한 절감안:
//   (a) "지워짐은 단조 증가" 메모이제이션 — 격자점 재검사는 줄지만 getImageData 자체 읽기 비용은
//       그대로라 실효성 없음 → 기각
//   (b) 다운스케일 오프스크린 캔버스에 drawImage 후 좁은 영역만 getImageData — 실질 절감이지만
//       엔진에 캔버스 하나를 더 두고 스케일 동기화를 관리해야 해 이 시점 확실한 이득 대비 복잡도가 큼 → 보류
//   (c) 디바운스/스로틀/우선순위 렌더링 — React 훅(#12 useGameCanvas) 책임이라 엔진에 넣지 않음
// 호출 빈도 조절(스로틀)은 #12에서 처리한다. 스와이프 중 프레임마다 부르지 않도록 호출부가 책임질 것.
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
