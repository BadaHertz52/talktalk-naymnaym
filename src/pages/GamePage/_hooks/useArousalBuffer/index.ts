import { useEffect, useRef, useState } from 'react';

export interface UseArousalBufferOptions {
  reducedMotion: boolean;
}

export interface UseArousalBufferResult {
  showCta: boolean;
  getDwellMs: () => number;
}

const CTA_DELAY_MS = 3000;

export function useArousalBuffer({
  reducedMotion,
}: UseArousalBufferOptions): UseArousalBufferResult {
  const [showCta, setShowCta] = useState(reducedMotion);
  const mountTimestamp = useRef(performance.now());

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setShowCta(true);
    }, CTA_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [reducedMotion]);

  return {
    showCta,
    getDwellMs: () => performance.now() - mountTimestamp.current,
  };
}
