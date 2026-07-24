import type { GA_EVENTS } from '@constants/analytics';

export type GaEventName = (typeof GA_EVENTS)[keyof typeof GA_EVENTS];

export type IntensityChange = 'same' | 'decreased' | 'increased';
