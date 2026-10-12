import { createCompletionTracker } from '@game/scratchProgress';

export const FINE_POINTER_TOTAL_TAPS = 40;
export const COARSE_POINTER_TOTAL_TAPS = 30;
export const HOLD_CHARGE_PERCENT_PER_SECOND = 10;
export const OBSERVATION_ONLY_OUTLIER_TAPS = 60;
export const OBSERVATION_ONLY_OUTLIER_MS = 20_000;

export type PullInputMethod = 'tap' | 'hold' | 'mixed' | null;

export interface CreatePullPowerOptions {
  totalTaps: number;
  onComplete: () => void;
}

export interface PullPower {
  tap(): void;
  keyDown(e: { repeat: boolean }): void;
  hold(deltaMs: number): void;
  getProgress(): number;
  getTapCount(): number;
  getInputMethod(): PullInputMethod;
  isComplete(): boolean;
}

export function getTotalTaps(isCoarsePointer: boolean): number {
  if (isCoarsePointer) {
    return COARSE_POINTER_TOTAL_TAPS;
  }

  return FINE_POINTER_TOTAL_TAPS;
}

export function createPullPower({ totalTaps, onComplete }: CreatePullPowerOptions): PullPower {
  let tapCount = 0;
  let holdProgress = 0;
  let usedTap = false;
  let usedHold = false;
  let completed = false;
  const completionTracker = createCompletionTracker(onComplete, 1);

  function getProgress(): number {
    const tapProgress = (tapCount / totalTaps) * 100;

    return Math.min(100, tapProgress + holdProgress);
  }

  function trackCompletion(): void {
    const progress = getProgress();

    completionTracker(progress / 100);
    completed = progress === 100;
  }

  function tap(): void {
    if (completed) {
      return;
    }

    tapCount++;
    usedTap = true;
    trackCompletion();
  }

  function hold(deltaMs: number): void {
    if (completed || deltaMs <= 0) {
      return;
    }

    holdProgress += (HOLD_CHARGE_PERCENT_PER_SECOND * deltaMs) / 1000;
    usedHold = true;
    trackCompletion();
  }

  function getInputMethod(): PullInputMethod {
    if (usedTap && usedHold) {
      return 'mixed';
    }

    if (usedTap) {
      return 'tap';
    }

    if (usedHold) {
      return 'hold';
    }

    return null;
  }

  return {
    tap,
    keyDown: ({ repeat }) => {
      if (!repeat) {
        tap();
      }
    },
    hold,
    getProgress,
    getTapCount: () => tapCount,
    getInputMethod,
    isComplete: () => completed,
  };
}
