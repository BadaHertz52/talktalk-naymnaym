import type { GaEventName } from '@/types/analytics';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: GaEventName, params?: Record<string, unknown>): void {
  window.gtag?.('event', name, params);
}
