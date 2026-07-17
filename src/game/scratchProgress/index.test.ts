import { describe, it, expect, vi } from 'vitest';
import {
  calculateErasedRatio,
  createCompletionTracker,
  DEFAULT_SCRATCH_COMPLETE_THRESHOLD,
  type AlphaSampler,
} from '.';

function makeSampler(erasedRatio: number, width: number, gridStep: number): AlphaSampler {
  const columns = Math.ceil(width / gridStep);
  const cutoff = Math.floor(columns * erasedRatio);

  return (x) => {
    const column = Math.floor(x / gridStep);

    return column < cutoff ? 0 : 255;
  };
}

describe('calculateErasedRatio', () => {
  it('전부 불투명하면 0을 반환한다', () => {
    const alphaAt: AlphaSampler = () => 255;

    const ratio = calculateErasedRatio({ alphaAt, width: 32, height: 32, gridStep: 16 });

    expect(ratio).toBe(0);
  });

  it('전부 투명하면 1을 반환한다', () => {
    const alphaAt: AlphaSampler = () => 0;

    const ratio = calculateErasedRatio({ alphaAt, width: 32, height: 32, gridStep: 16 });

    expect(ratio).toBe(1);
  });

  it('절반이 투명하면 0.5를 반환한다', () => {
    const alphaAt = makeSampler(0.5, 32, 16);

    const ratio = calculateErasedRatio({ alphaAt, width: 32, height: 32, gridStep: 16 });

    expect(ratio).toBe(0.5);
  });

  it('gridStep이 0 이하이면 무한 루프 대신 0을 반환한다', () => {
    const alphaAt: AlphaSampler = () => 0;

    const ratio = calculateErasedRatio({ alphaAt, width: 32, height: 32, gridStep: 0 });

    expect(ratio).toBe(0);
  });

  it('width가 Infinity이면 무한 루프 대신 0을 반환한다', () => {
    const alphaAt: AlphaSampler = () => 0;

    const ratio = calculateErasedRatio({ alphaAt, width: Infinity, height: 32, gridStep: 16 });

    expect(ratio).toBe(0);
  });

  it('height가 NaN이면 무한 루프 대신 0을 반환한다', () => {
    const alphaAt: AlphaSampler = () => 0;

    const ratio = calculateErasedRatio({ alphaAt, width: 32, height: NaN, gridStep: 16 });

    expect(ratio).toBe(0);
  });
});

describe('createCompletionTracker', () => {
  it('임계값 미도달 시 콜백이 호출되지 않는다', () => {
    const onComplete = vi.fn();
    const tracker = createCompletionTracker(onComplete, DEFAULT_SCRATCH_COMPLETE_THRESHOLD);

    tracker(0.5);

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('임계값 도달 시 완료 콜백이 1회 호출된다', () => {
    const onComplete = vi.fn();
    const tracker = createCompletionTracker(onComplete, DEFAULT_SCRATCH_COMPLETE_THRESHOLD);

    tracker(0.95);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('도달 후 재호출해도 콜백이 다시 발생하지 않는다', () => {
    const onComplete = vi.fn();
    const tracker = createCompletionTracker(onComplete, DEFAULT_SCRATCH_COMPLETE_THRESHOLD);

    tracker(0.95);
    tracker(0.97);
    tracker(1);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
