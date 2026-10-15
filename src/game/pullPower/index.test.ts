import { describe, expect, it, vi } from 'vitest';
import {
  HOLD_CHARGE_PERCENT_PER_SECOND,
  OBSERVATION_ONLY_OUTLIER_MS,
  OBSERVATION_ONLY_OUTLIER_TAPS,
  FINE_POINTER_TOTAL_TAPS,
} from './constants';
import { createPullPower, getTotalTaps } from '.';

function createPower(totalTaps: number = FINE_POINTER_TOTAL_TAPS) {
  const onComplete = vi.fn();
  const power = createPullPower({ totalTaps, onComplete });

  return { power, onComplete };
}

function tapTimes(count: number, totalTaps: number) {
  const { power, onComplete } = createPower(totalTaps);

  for (let index = 0; index < count; index++) {
    power.tap();
  }

  return { power, onComplete };
}

describe('pullPower', () => {
  describe(`${FINE_POINTER_TOTAL_TAPS}타 게이지`, () => {
    it('0타, 1타, N-1타, N타, N+1타이면 경계 진행률을 유지한다', () => {
      const zeroTaps = tapTimes(0, FINE_POINTER_TOTAL_TAPS);
      const oneTap = tapTimes(1, FINE_POINTER_TOTAL_TAPS);
      const beforeComplete = tapTimes(FINE_POINTER_TOTAL_TAPS - 1, FINE_POINTER_TOTAL_TAPS);
      const complete = tapTimes(FINE_POINTER_TOTAL_TAPS, FINE_POINTER_TOTAL_TAPS);
      const overComplete = tapTimes(FINE_POINTER_TOTAL_TAPS + 1, FINE_POINTER_TOTAL_TAPS);

      expect(zeroTaps.power.getProgress()).toBe(0);
      expect(oneTap.power.getProgress()).toBeCloseTo(100 / FINE_POINTER_TOTAL_TAPS);
      expect(beforeComplete.power.getProgress()).toBeCloseTo(
        (100 * (FINE_POINTER_TOTAL_TAPS - 1)) / FINE_POINTER_TOTAL_TAPS,
      );
      expect(complete.power.getProgress()).toBe(100);
      expect(overComplete.power.getProgress()).toBe(100);
      expect(complete.power.getTapCount()).toBe(FINE_POINTER_TOTAL_TAPS);
      expect(overComplete.power.getTapCount()).toBe(FINE_POINTER_TOTAL_TAPS);
    });
  });

  it('탭과 홀드를 어떤 순서로 섞어도 진행률이 감소하지 않는다', () => {
    const { power } = createPower();
    const progress = [power.getProgress()];

    power.hold(250);
    progress.push(power.getProgress());
    power.tap();
    progress.push(power.getProgress());
    power.hold(100);
    progress.push(power.getProgress());
    power.keyDown({ repeat: false });
    progress.push(power.getProgress());

    expect(progress).toEqual([...progress].sort((left, right) => left - right));
    expect(progress.at(-1)).toBeCloseTo(8.5);
  });

  it('1000ms 홀드하면 10% 충전된다', () => {
    const { power } = createPower();

    power.hold(1000);

    expect(power.getProgress()).toBe(HOLD_CHARGE_PERCENT_PER_SECOND);
  });

  it('10000ms 홀드하면 100% 충전된다', () => {
    const { power } = createPower();

    power.hold(10000);

    expect(power.getProgress()).toBe(100);
  });

  it('아주 짧게 홀드해도 충전된다', () => {
    const { power } = createPower();

    power.hold(1);

    expect(power.getProgress()).toBeCloseTo(0.01);
  });

  it('탭과 홀드를 섞으면 같은 게이지에 누적된다', () => {
    const { power } = createPower();

    power.tap();
    power.hold(1000);

    expect(power.getProgress()).toBeCloseTo(12.5);
  });

  it('repeat이 true인 키다운이면 타수에 포함되지 않는다', () => {
    const { power } = createPower();

    power.keyDown({ repeat: true });
    power.keyDown({ repeat: false });

    expect(power.getTapCount()).toBe(1);
    expect(power.getProgress()).toBeCloseTo(2.5);
  });

  it('60타를 초과해도 진행률이 100을 넘지 않는다', () => {
    const { power } = tapTimes(OBSERVATION_ONLY_OUTLIER_TAPS + 1, FINE_POINTER_TOTAL_TAPS);

    expect(power.getProgress()).toBe(100);
    expect(power.getTapCount()).toBe(FINE_POINTER_TOTAL_TAPS);
  });

  it('관찰 전용 이상치 상수는 60타와 20000ms로 제공된다', () => {
    const constants = [OBSERVATION_ONLY_OUTLIER_TAPS, OBSERVATION_ONLY_OUTLIER_MS];

    expect(constants).toEqual([60, 20_000]);
  });

  it('탭으로 완료하면 완료 콜백이 정확히 한 번 호출된다', () => {
    const { power, onComplete } = createPower();

    for (let index = 0; index < FINE_POINTER_TOTAL_TAPS + 1; index++) {
      power.tap();
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(power.isComplete()).toBe(true);
  });

  describe('getTotalTaps', () => {
    it('coarse 포인터이면 30타를 반환한다', () => {
      expect(getTotalTaps(true)).toBe(30);
    });

    it('coarse 포인터가 아니면 40타를 반환한다', () => {
      expect(getTotalTaps(false)).toBe(40);
    });
  });

  it('홀드로 초과 완료해도 완료 콜백이 정확히 한 번 호출된다', () => {
    const { power, onComplete } = createPower();

    power.hold(11_000);
    power.hold(1_000);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(power.getProgress()).toBe(100);
  });

  it('탭만 입력하면 tap을 반환한다', () => {
    const { power } = createPower();

    power.tap();

    expect(power.getInputMethod()).toBe('tap');
  });

  it('홀드만 입력하면 hold를 반환한다', () => {
    const { power } = createPower();

    power.hold(1);

    expect(power.getInputMethod()).toBe('hold');
  });

  it('탭과 홀드를 모두 입력하면 mixed를 반환한다', () => {
    const { power } = createPower();

    power.tap();
    power.hold(1);

    expect(power.getInputMethod()).toBe('mixed');
  });
});
