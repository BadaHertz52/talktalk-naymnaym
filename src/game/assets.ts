import type { GameAssets } from '../types/game';

export const ASSETS: GameAssets = {
  bunny: {
    idle: '/assets/bunny-idle.webp',
    eating: '/assets/bunny-eating.webp',
    cart: '/assets/bunny-cart.webp',
    expression: {
      1: '/assets/bunny-intensity-1.webp',
      2: '/assets/bunny-intensity-2.webp',
      3: '/assets/bunny-intensity-3.webp',
      4: '/assets/bunny-intensity-4.webp',
      5: '/assets/bunny-intensity-5.webp',
    },
  },
  carrot: {
    full: '/assets/carrot-full.webp',
  },
  weather: {
    sun: '/assets/weather-sun.webp',
    partlyCloudy: '/assets/weather-partly-cloudy.webp',
    cloudy: '/assets/weather-cloudy.webp',
    overcast: '/assets/weather-overcast.webp',
    lightning: '/assets/weather-lightning.webp',
  },
} as const;

// MeasurePage에서 미리 받아둘 GamePage 에셋 경로 — bunny-eating은 가장 무거워(~300KB) 다음 페이지 진입 전 프리로드 대상
export const GAME_PAGE_PRELOAD: readonly string[] = [ASSETS.bunny.eating];

// GamePage에서 미리 받아둘 ResultPage 에셋 경로 — intensityAfter < intensityBefore면 5장이 동시에 보이므로 미리 전부 로드
export const RESULT_PAGE_PRELOAD: readonly string[] = Object.values(ASSETS.bunny.expression);
