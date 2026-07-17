import { describe, it, expect } from 'vitest';
import { posToSegments } from './posToSegments';

describe('posToSegments', () => {
  it('returns 1 when width is 0', () => {
    expect(posToSegments(0, 0)).toBe(1);
  });

  it('returns 1 when x is 0', () => {
    expect(posToSegments(0, 100)).toBe(1);
  });

  it('returns 10 when x equals width', () => {
    expect(posToSegments(100, 100)).toBe(10);
  });

  it('clamps to 1 when x is negative', () => {
    expect(posToSegments(-50, 100)).toBe(1);
  });

  it('clamps to 10 when x exceeds width', () => {
    expect(posToSegments(150, 100)).toBe(10);
  });

  it('rounds up via ceil for a midpoint value', () => {
    expect(posToSegments(21, 100)).toBe(3);
  });
});
