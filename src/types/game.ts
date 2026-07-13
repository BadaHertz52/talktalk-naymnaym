import type { EmotionExpressionStep, WeatherIcon } from './session';

export interface Position {
  x: number;
  y: number;
}

// 굴러가는 당근 상태
export interface CarrotState {
  position: Position;
  rotation: number;
  targetChunkId: string | null;
}

export interface EmotionChunk {
  id: string;
  text: string;
  position: Position;
  eaten: boolean;
}

export type OnGameComplete = () => void;

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
