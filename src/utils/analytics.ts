import type { GaEventName, GaEventParamsMap } from '@/types/analytics';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent<E extends GaEventName>(
  name: E,
  ...args: E extends keyof GaEventParamsMap ? [params: GaEventParamsMap[E]] : []
): void {
  window.gtag?.('event', name, args[0]);
}
