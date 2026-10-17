import { describe, expect, it } from 'vitest';
import { getPullStep } from './pullStep';

describe('getPullStep', () => {
  describe('5% 단위 경계값 직전·직후', () => {
    it.each([
      [0, 0],
      [4.9, 0],
      [5, 1],
      [9.9, 1],
      [10, 2],
      [50, 10],
      [94.9, 18],
      [95, 19],
      [100, 19],
    ])('진행률 %s%면 %i단계다', (progress, step) => {
      expect(getPullStep(progress)).toBe(step);
    });
  });
});
