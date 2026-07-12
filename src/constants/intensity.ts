import type { EmotionIntensity, WeatherIcon } from '../types/session';

export const INTENSITY_WEATHER: Record<EmotionIntensity, WeatherIcon> = {
  1: 'sun',
  2: 'cloud',
  3: 'rain',
  4: 'lightning',
};
