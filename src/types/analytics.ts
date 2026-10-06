import type { GA_EVENTS, GA_PARAMS } from '@constants/analytics';
import type { EmotionIntensity } from '@/types/session';

export type GaEventName = (typeof GA_EVENTS)[keyof typeof GA_EVENTS];

export type IntensityChange = 'same' | 'decreased' | 'increased';

// #46 머지 후 src/types/game.ts의 GameMode import로 교체 — 지금은 해당 타입이 없어 임시로 둔다
export type GaGameMode = 'scratch' | 'pull';

export type PullInputMethod = 'tap' | 'hold' | 'mixed';

// 중도 이탈(game_cleared: false)은 버퍼를 거치지 않으므로 skipped/dwell 값이 고정된다
type ResultOutcomeParams =
  | { [GA_PARAMS.gameCleared]: true; [GA_PARAMS.bufferSkipped]: boolean }
  | { [GA_PARAMS.gameCleared]: false; [GA_PARAMS.bufferSkipped]: true };

type GameOutcomeParams =
  | {
      [GA_PARAMS.gameCleared]: true;
      [GA_PARAMS.bufferSkipped]: boolean;
      [GA_PARAMS.bufferDwellMs]: number;
    }
  | {
      [GA_PARAMS.gameCleared]: false;
      [GA_PARAMS.bufferSkipped]: true;
      [GA_PARAMS.bufferDwellMs]: 0;
    };

type GameModeResultParams =
  | {
      [GA_PARAMS.gameMode]: 'pull';
      [GA_PARAMS.pullTaps]: number;
      [GA_PARAMS.pullInputMethod]: PullInputMethod;
    }
  | {
      [GA_PARAMS.gameMode]: 'scratch';
      [GA_PARAMS.scratchRatio]: number;
    };

// 호출부 연결 단계(#55 나머지)에서 GaEventParamsMap의 step_game_complete로 연결한다
export type GameCompleteParams = GameOutcomeParams &
  GameModeResultParams & {
    [GA_PARAMS.gameReplayCount]: number;
    [GA_PARAMS.gameDurationMs]: number;
  };

type BaseResultCompleteParams = {
  [GA_PARAMS.intensityBefore]: EmotionIntensity | null;
  [GA_PARAMS.intensityAfter]: EmotionIntensity | null;
  [GA_PARAMS.intensityChange]: IntensityChange;
};

// 호출부 연결 단계(#55 나머지)에서 GaEventParamsMap의 step_result_complete를 이 타입으로 교체한다
export type ResultCompleteParams = BaseResultCompleteParams &
  ResultOutcomeParams & {
    [GA_PARAMS.gameMode]: GaGameMode;
  };

export type GaEventParamsMap = {
  [GA_EVENTS.resultComplete]: BaseResultCompleteParams;
  [GA_EVENTS.gameModePromptView]: {
    [GA_PARAMS.intensityBefore]: EmotionIntensity;
  };
  [GA_EVENTS.gameModeSelect]: {
    [GA_PARAMS.gameMode]: GaGameMode;
    [GA_PARAMS.intensityBefore]: EmotionIntensity;
    [GA_PARAMS.decisionMs]: number;
  };
  [GA_EVENTS.gameModeDismiss]: {
    [GA_PARAMS.intensityBefore]: EmotionIntensity;
    [GA_PARAMS.decisionMs]: number;
  };
  [GA_EVENTS.gameAbandon]: {
    [GA_PARAMS.gameMode]: GaGameMode;
    [GA_PARAMS.progressRatio]: number;
  };
};
