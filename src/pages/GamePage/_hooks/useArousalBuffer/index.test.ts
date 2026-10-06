// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useArousalBuffer } from './index';

function setupFakeClock() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
}

describe('useArousalBuffer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('showCta', () => {
    it('3.0초가 지나면 showCta가 true가 된다', () => {
      setupFakeClock();

      const { result } = renderHook(() => useArousalBuffer());

      act(() => {
        vi.advanceTimersByTime(2999);
      });

      expect(result.current.showCta).toBe(false);

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current.showCta).toBe(true);
    });
  });

  describe('언마운트', () => {
    it('언마운트 후에는 타이머가 정리되어 상태가 갱신되지 않는다', () => {
      setupFakeClock();
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
      const { unmount } = renderHook(() => useArousalBuffer());

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('getDwellMs', () => {
    it('마운트 이후 경과한 시간을 반환한다', () => {
      setupFakeClock();

      const { result } = renderHook(() => useArousalBuffer());

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(result.current.getDwellMs()).toBe(1500);
    });
  });
});
