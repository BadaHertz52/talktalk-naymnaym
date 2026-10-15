import { describe, expect, it } from 'vitest';
import { getPullStep, getTapShakePx } from './pullStep';

describe('getPullStep', () => {
  describe('단계 경계값 직전·직후', () => {
    it.each([
      [0, 0],
      [19, 0],
      [20, 1],
      [44, 1],
      [45, 2],
      [69, 2],
      [70, 3],
      [89, 3],
      [90, 4],
      [100, 4],
    ])('진행률 %i%면 %i단계다', (progress, step) => {
      expect(getPullStep(progress)).toBe(step);
    });
  });
});

describe('getTapShakePx', () => {
  it('구간 초반이면 1px, 다음 단계에 가까운 후반이면 2px이다', () => {
    expect(getTapShakePx(5)).toBe(1);
    expect(getTapShakePx(15)).toBe(2);
    expect(getTapShakePx(50)).toBe(1);
    expect(getTapShakePx(65)).toBe(2);
  });

  it('마지막 단계에서는 1px이다', () => {
    expect(getTapShakePx(95)).toBe(1);
  });
});
