import type { GameAssets } from '../types/game';
import bunnyIdle from '@assets/images/bunny-idle.webp';
import bunnyEating from '@assets/images/bunny-eating.webp';
import bunnyCart from '@assets/images/bunny-cart.webp';
import bunnyIntensity1 from '@assets/images/bunny-intensity-1.webp';
import bunnyIntensity2 from '@assets/images/bunny-intensity-2.webp';
import bunnyIntensity3 from '@assets/images/bunny-intensity-3.webp';
import bunnyIntensity4 from '@assets/images/bunny-intensity-4.webp';
import bunnyIntensity5 from '@assets/images/bunny-intensity-5.webp';
import carrotFull from '@assets/images/carrot-full.webp';
import weatherSun from '@assets/images/weather-sun.webp';
import weatherPartlyCloudy from '@assets/images/weather-partly-cloudy.webp';
import weatherCloudy from '@assets/images/weather-cloudy.webp';
import weatherOvercast from '@assets/images/weather-overcast.webp';
import weatherLightning from '@assets/images/weather-lightning.webp';

export const ASSETS: GameAssets = {
  bunny: {
    idle: bunnyIdle,
    eating: bunnyEating,
    cart: bunnyCart,
    expression: {
      1: bunnyIntensity1,
      2: bunnyIntensity2,
      3: bunnyIntensity3,
      4: bunnyIntensity4,
      5: bunnyIntensity5,
    },
  },
  carrot: {
    full: carrotFull,
  },
  weather: {
    sun: weatherSun,
    partlyCloudy: weatherPartlyCloudy,
    cloudy: weatherCloudy,
    overcast: weatherOvercast,
    lightning: weatherLightning,
  },
} as const;

// MeasurePage에서 미리 받아둘 GamePage 에셋 경로 — bunny-eating은 가장 무거워(~45KB) 다음 페이지 진입 전 프리로드 대상
export const GAME_PAGE_PRELOAD: readonly string[] = [ASSETS.bunny.eating];

// GamePage에서 미리 받아둘 ResultPage 에셋 경로 — intensityAfter < intensityBefore면 5장이 동시에 보이므로 미리 전부 로드
export const RESULT_PAGE_PRELOAD: readonly string[] = Object.values(ASSETS.bunny.expression);
