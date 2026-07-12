import type { EmotionIntensity, WeatherIcon } from '../types/session';

export const INTENSITY_WEATHER: Record<EmotionIntensity, WeatherIcon> = {
  1: 'sun',
  2: 'partlyCloudy',
  3: 'cloudy',
  4: 'overcast',
  5: 'lightning',
};
