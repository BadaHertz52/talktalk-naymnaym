import type { EmotionExpressionStep, WeatherIcon } from './session';

export interface Position {
  x: number;
  y: number;
}

// 스크래치 커버 설정 (감정 텍스트 레이어)
export interface ScratchCoverOptions {
  text: string;
  width: number;
  height: number;
  // 텍스트만의 불투명도(0~1) — 생략 시 완전 불투명
  textOpacity?: number;
  // true면 실제 글자 대신 비공백 구간에 밑줄만 그린다 (InputPage 시크릿 모드와 동일한 마스킹)
  secretMode?: boolean;
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
