export type EmotionIntensity = 1 | 2 | 3 | 4

export type WeatherIcon = 'sun' | 'cloud' | 'rain' | 'lightning'

export const INTENSITY_WEATHER: Record<EmotionIntensity, WeatherIcon> = {
  1: 'sun',
  2: 'cloud',
  3: 'rain',
  4: 'lightning',
}

export type Step = 'input' | 'measure' | 'game' | 'result'
