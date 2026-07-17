import { describe, it, expect } from 'vitest';
import { getBrushRadius, clampToCanvas, interpolatePoints } from '.';

describe('getBrushRadius', () => {
  it('390px 폭 기준 약 28px 반경을 반환한다', () => {
    expect(getBrushRadius(390)).toBeCloseTo(28, 0);
  });

  it('캔버스 폭에 비례해 반경이 커진다', () => {
    expect(getBrushRadius(780)).toBeCloseTo(56, 0);
  });
});

describe('clampToCanvas', () => {
  it('음수 좌표는 0으로 클램프된다', () => {
    const result = clampToCanvas({ pos: { x: -10, y: -20 }, width: 300, height: 400 });

    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('캔버스 크기를 초과하는 좌표는 경계값으로 클램프된다', () => {
    const result = clampToCanvas({ pos: { x: 500, y: 600 }, width: 300, height: 400 });

    expect(result).toEqual({ x: 300, y: 400 });
  });

  it('캔버스 내부 좌표는 그대로 유지된다', () => {
    const result = clampToCanvas({ pos: { x: 150, y: 200 }, width: 300, height: 400 });

    expect(result).toEqual({ x: 150, y: 200 });
  });
});

describe('interpolatePoints', () => {
  it('두 점이 같으면 to 좌표 하나만 반환한다', () => {
    const points = interpolatePoints({ from: { x: 10, y: 10 }, to: { x: 10, y: 10 } });

    expect(points).toEqual([{ x: 10, y: 10 }]);
  });

  it('먼 거리를 보간하면 마지막 점이 to와 일치한다', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 100, y: 0 };

    const points = interpolatePoints({ from, to });

    expect(points[points.length - 1]).toEqual(to);
  });

  it('보간점 사이 간격이 기대 간격 이하로 생성된다', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 100, y: 0 };
    const maxAllowedStep = 6;

    const points = interpolatePoints({ from, to });
    const allPoints = [from, ...points];

    for (let i = 1; i < allPoints.length; i++) {
      const dx = allPoints[i].x - allPoints[i - 1].x;
      const dy = allPoints[i].y - allPoints[i - 1].y;
      const step = Math.hypot(dx, dy);

      expect(step).toBeLessThanOrEqual(maxAllowedStep + 1e-9);
    }
  });
});
