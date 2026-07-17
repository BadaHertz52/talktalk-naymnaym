import type { EmotionExpressionStep, WeatherIcon } from './session';

export interface Position {
  x: number;
  y: number;
}

export type OnGameComplete = () => void;

// 스크래치 커버 설정 (감정 텍스트 레이어)
export interface ScratchCoverOptions {
  text: string;
  width: number;
  height: number;
}

// 지워진 비율(0~1) 변경 콜백 — 진행률 바 갱신용
export type OnProgress = (ratio: number) => void;

export interface GameAssets {
  bunny: {
    idle: string;
    eating: string;
    cart: string;
    expression: Record<EmotionExpressionStep, string>;
  };
  carrot: {
    full: string;
  };
  weather: Record<WeatherIcon, string>;
}
