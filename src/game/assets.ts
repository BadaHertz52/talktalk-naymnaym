import type { GameAssets } from '../types/game';

export const ASSETS: GameAssets = {
  bunny: {
    idle: '/assets/bunny-idle.webp',
    eating: '/assets/bunny-eating.webp',
    cart: '/assets/bunny-cart.webp',
    intensity: {
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
