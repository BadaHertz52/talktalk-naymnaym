import type { GA_EVENTS, GA_PARAMS } from '@constants/analytics';
import type { EmotionIntensity } from '@/types/session';

export type GaEventName = (typeof GA_EVENTS)[keyof typeof GA_EVENTS];

export type IntensityChange = 'same' | 'decreased' | 'increased';

export type GaEventParamsMap = {
  [GA_EVENTS.resultComplete]: {
    [GA_PARAMS.intensityBefore]: EmotionIntensity | null;
    [GA_PARAMS.intensityAfter]: EmotionIntensity | null;
    [GA_PARAMS.intensityChange]: IntensityChange;
  };
};
