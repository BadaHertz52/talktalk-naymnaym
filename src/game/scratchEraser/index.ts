import type { Position } from '@/types/game';

// 캔버스 390px 폭 기준 브러시 반경 28px
const BRUSH_RADIUS_RATIO = 28 / 390;

// 두 점 사이 보간 간격 상한(px) — 이보다 촘촘하게 점을 찍어 빠른 드래그의 끊김을 막는다
const INTERPOLATION_STEP = 6;

export function getBrushRadius(canvasWidth: number): number {
  return canvasWidth * BRUSH_RADIUS_RATIO;
}

interface ClampToCanvasOptions {
  pos: Position;
  width: number;
  height: number;
}
// 책임 소재: 이 함수는 eraseStroke 등 엔진 내부에서 자동 호출되지 않는다.
// 좌표 클램프를 엔진이 책임질지 호출자(#12 useGameCanvas)가 책임질지는 #12 통합 단계에서 확정한다.
export function clampToCanvas({ pos, width, height }: ClampToCanvasOptions): Position {
  return {
    x: Math.min(Math.max(pos.x, 0), width),
    y: Math.min(Math.max(pos.y, 0), height),
  };
}

interface InterpolatePointsOptions {
  from: Position;
  to: Position;
}

// from → to 사이를 INTERPOLATION_STEP 이하 간격으로 보간한 점 목록 (from 미포함, to 포함)
export function interpolatePoints({ from, to }: InterpolatePointsOptions): Position[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);

  if (distance === 0) {
    return [to];
  }

  const steps = Math.ceil(distance / INTERPOLATION_STEP);
  const points: Position[] = [];

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    points.push({ x: from.x + dx * t, y: from.y + dy * t });
  }

  return points;
}

interface EraseStrokeOptions {
  ctx: CanvasRenderingContext2D;
  from: Position;
  to: Position;
  radius: number;
}

// ctx 의존 래퍼 — from에서 to까지 보간된 원형 브러시로 destination-out 지우기
export function eraseStroke({ ctx, from, to, radius }: EraseStrokeOptions): void {
  const points = interpolatePoints({ from, to });

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = radius * 2;

  // 탭(from === to)은 길이 0 경로라 브라우저에 따라 stroke가 스킵될 수 있어 원으로 보강한다
  ctx.beginPath();
  ctx.arc(from.x, from.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);

  for (const point of points) {
    ctx.lineTo(point.x, point.y);
  }

  ctx.stroke();
  ctx.restore();
}
