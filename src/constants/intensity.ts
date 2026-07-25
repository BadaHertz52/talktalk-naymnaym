import type { EmotionExpressionStep, WeatherIcon } from '../types/session';

export const EXPRESSION_WEATHER: Record<EmotionExpressionStep, WeatherIcon> = {
  1: 'sun',
  2: 'partlyCloudy',
  3: 'cloudy',
  4: 'overcast',
  5: 'lightning',
};
