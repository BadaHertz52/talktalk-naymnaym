import { useEffect, useRef, useState } from 'react';

export interface UseArousalBufferResult {
  showCta: boolean;
  getDwellMs: () => number;
}

const CTA_DELAY_MS = 3000;

export function useArousalBuffer(): UseArousalBufferResult {
  const [showCta, setShowCta] = useState(false);
  const mountTimestamp = useRef(performance.now());

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowCta(true);
    }, CTA_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return {
    showCta,
    getDwellMs: () => performance.now() - mountTimestamp.current,
  };
}
