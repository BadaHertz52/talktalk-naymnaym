import type { EmotionExpressionStep, WeatherIcon } from '../types/session';

export const EXPRESSION_WEATHER: Record<EmotionExpressionStep, WeatherIcon> = {
  1: 'sun',
  2: 'partlyCloudy',
  3: 'cloudy',
  4: 'overcast',
  5: 'lightning',
};

export const WEATHER_LABEL: Record<EmotionExpressionStep, string> = {
  1: '맑음 — 가볍고 환해요',
  2: '구름 조금 — 살짝 신경 쓰여요',
  3: '흐림 — 꽤 무겁네요',
  4: '잔뜩 흐림 — 많이 무거워요',
  5: '천둥번개 — 굉장히 신경 쓰여요',
};
