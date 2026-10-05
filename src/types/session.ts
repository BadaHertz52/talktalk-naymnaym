export type EmotionIntensity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type EmotionExpressionStep = 1 | 2 | 3 | 4 | 5;

export type WeatherIcon = 'sun' | 'partlyCloudy' | 'cloudy' | 'overcast' | 'lightning';

export type GameMode = 'scratch' | 'pull';

export type Step = 'input' | 'measure' | 'game' | 'result';

export interface StepState<Data> {
  completed: boolean;
  data: Data;
}

export interface InputData {
  emotionText: string;
  secretMode: boolean;
}

export interface MeasureData {
  intensityBefore: EmotionIntensity | null;
  gameMode: GameMode | null;
}

export interface GameData {
  cleared: boolean;
  replayCount: number;
}

export interface ResultData {
  intensityAfter: EmotionIntensity | null;
  afterEmotionText: string;
}

export interface SessionSteps {
  input: StepState<InputData>;
  measure: StepState<MeasureData>;
  game: StepState<GameData>;
  result: StepState<ResultData>;
}
