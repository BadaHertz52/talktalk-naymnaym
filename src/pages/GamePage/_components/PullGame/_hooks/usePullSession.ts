import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { createPullPower, getTotalTaps } from '@game/pullPower';

const TAP_KEYS = new Set([' ', 'Enter', 'ArrowUp']);
const HOLD_KEYS = new Set([' ', 'ArrowUp']);
// 연타하던 입력이 완료 직후 "다음 ▸"에 떨어져 버퍼로 넘어가지 않도록, 완료 후 이 시간 동안은 클릭을 무시한다
const NEXT_GUARD_MS = 600;

interface UsePullSessionOptions {
  onNext: () => void;
}

export function usePullSession({ onNext }: UsePullSessionOptions) {
  const [power] = useState(() => {
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

    return createPullPower({ totalTaps: getTotalTaps(isCoarsePointer), onComplete: () => {} });
  });
  const [progress, setProgress] = useState(0);
  const [inputCount, setInputCount] = useState(0);
  const [holding, setHolding] = useState(false);
  const holdFrameRef = useRef<number | null>(null);
  const holdLastTimeRef = useRef<number | null>(null);
  const pressedKeysRef = useRef(new Set<string>());
  const suppressKeyClickRef = useRef(false);
  const nextArmedRef = useRef(false);
  const completedAtRef = useRef(0);
  const completed = progress === 100;

  const tap = (pull: () => void) => {
    if (power.isComplete()) return;

    pull();
    setProgress(power.getProgress());
    setInputCount((count) => count + 1);
  };

  const handlePrimaryClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail !== 0) return;
    if (suppressKeyClickRef.current) {
      suppressKeyClickRef.current = false;
      return;
    }
    tap(power.tap);
  };

  const stopHold = () => {
    if (holdFrameRef.current === null) {
      setHolding(false);
      return;
    }
    cancelAnimationFrame(holdFrameRef.current);
    holdFrameRef.current = null;
    holdLastTimeRef.current = null;
    setHolding(false);
  };

  const startHold = () => {
    if (power.isComplete() || holdFrameRef.current !== null) return;

    const frame = () => {
      const now = performance.now();
      const last = holdLastTimeRef.current ?? now;
      power.hold(now - last);
      holdLastTimeRef.current = now;
      setProgress(power.getProgress());

      if (power.isComplete()) {
        holdFrameRef.current = null;
        setHolding(false);
        return;
      }
      holdFrameRef.current = requestAnimationFrame(frame);
    };
    holdLastTimeRef.current = performance.now();
    holdFrameRef.current = requestAnimationFrame(frame);
    setHolding(true);
  };

  const isPrimaryTarget = (target: EventTarget | null): boolean => {
    return target instanceof Element && target.closest('[data-pull-primary]') !== null;
  };

  const isBlockedTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof Element)) return false;
    const button = target.closest('button');
    return (
      (button !== null && !button.hasAttribute('data-pull-primary')) ||
      Boolean(target.closest('a, input, textarea, select, [contenteditable="true"]'))
    );
  };

  const handleNextClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (performance.now() - completedAtRef.current < NEXT_GUARD_MS) return;
    if (e.detail !== 0 && !nextArmedRef.current) return;
    onNext();
  };

  const handlersRef = useRef({ isPrimaryTarget, isBlockedTarget, tap, startHold, stopHold });
  useEffect(() => {
    handlersRef.current = { isPrimaryTarget, isBlockedTarget, tap, startHold, stopHold };
  });

  useEffect(() => {
    if (completed) completedAtRef.current = performance.now();
  }, [completed]);

  useEffect(() => {
    return () => {
      if (holdFrameRef.current !== null) cancelAnimationFrame(holdFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const cleanupStopHold = handlersRef.current.stopHold;
    const pressedKeys = pressedKeysRef.current;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const handlers = handlersRef.current;
      if (!TAP_KEYS.has(e.key) || handlers.isBlockedTarget(e.target)) return;

      const primaryTarget = handlers.isPrimaryTarget(e.target);
      e.preventDefault();
      if (primaryTarget) suppressKeyClickRef.current = true;
      if (e.repeat || pressedKeys.has(e.key)) return;

      const isCompletingHold =
        HOLD_KEYS.has(e.key) && [...pressedKeys].some((key) => HOLD_KEYS.has(key));
      pressedKeys.add(e.key);
      if (!isCompletingHold) handlers.tap(() => power.keyDown({ repeat: e.repeat }));
      if (HOLD_KEYS.has(e.key) && pressedKeys.has(' ') && pressedKeys.has('ArrowUp')) {
        handlers.startHold();
      }
    };

    const handleKeyUp = (e: globalThis.KeyboardEvent) => {
      const handlers = handlersRef.current;
      if (!TAP_KEYS.has(e.key) || handlers.isBlockedTarget(e.target)) return;
      e.preventDefault();
      pressedKeys.delete(e.key);
      if (!pressedKeys.has(' ') || !pressedKeys.has('ArrowUp')) handlers.stopHold();
    };

    const handleBlur = () => {
      pressedKeys.clear();
      handlersRef.current.stopHold();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      pressedKeys.clear();
      cleanupStopHold();
    };
  }, [power]);

  return {
    progress,
    inputCount,
    holding,
    completed,
    tap: () => tap(power.tap),
    getStats: () => ({
      pullTaps: power.getTapCount(),
      pullInputMethod: power.getInputMethod() ?? ('tap' as const),
    }),
    handlePrimaryClick,
    handleNextClick,
    armNext: () => {
      nextArmedRef.current = true;
    },
    resetPrimaryClickSuppression: () => {
      suppressKeyClickRef.current = false;
    },
  };
}
