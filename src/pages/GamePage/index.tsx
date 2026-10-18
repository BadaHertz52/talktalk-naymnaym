import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameMode } from '@/types/session';
import { useSessionStore } from '@stores/sessionStore';
import { focusHeading } from '@components/PageLayout/focusHeading';
import { BUFFER_PRELOAD, RESULT_PAGE_PRELOAD } from '@game/assets';
import { PATHS } from '@constants/paths';
import { GA_EVENTS, GA_PARAMS } from '@constants/analytics';
import { trackEvent } from '@utils/analytics';
import { useFireOnce } from '@hooks/useFireOnce';
import Button from '@/components/Button';
import ScratchGame from './_components/ScratchGame';
import type { ScratchPlayResult } from './_components/ScratchGame';
import PullGame from './_components/PullGame';
import type { PullPlayResult } from './_components/PullGame';
import ArousalBuffer from './_components/ArousalBuffer';
import { BUFFER_TEST_IDS } from './_constants/gameTestIds';
import styles from './index.module.css';

const BUFFER_TOP_MESSAGE: Record<GameMode, string> = {
  scratch: '글자 다 지웠어요!',
  pull: '당근 다 뽑았어요!',
};

// "한 번 더 뽑기"는 2회까지 (총 3플레이, 기획 §4 #24)
const MAX_PULL_REPLAYS = 2;

type PlayResult = PullPlayResult | ScratchPlayResult;

function getModeParams(result: PlayResult) {
  return result.mode === 'pull'
    ? {
        [GA_PARAMS.gameMode]: 'pull' as const,
        [GA_PARAMS.pullTaps]: result.pullTaps,
        [GA_PARAMS.pullInputMethod]: result.pullInputMethod,
      }
    : {
        [GA_PARAMS.gameMode]: 'scratch' as const,
        [GA_PARAMS.scratchRatio]: result.scratchRatio,
      };
}

export default function GamePage() {
  const navigate = useNavigate();
  const gameMode = useSessionStore((s) => s.steps.measure.data.gameMode);
  const completeGame = useSessionStore((s) => s.completeGame);
  const replayCount = useSessionStore((s) => s.steps.game.data.replayCount);
  const incrementReplayCount = useSessionStore((s) => s.incrementReplayCount);
  const fireOnce = useFireOnce();
  const [phase, setPhase] = useState<{ name: 'playing' } | { name: 'buffer'; result: PlayResult }>({
    name: 'playing',
  });

  const finish = (
    result: PlayResult,
    { getDwellMs, skipped }: { getDwellMs: () => number; skipped: boolean },
  ) => {
    fireOnce(() => {
      trackEvent(GA_EVENTS.gameComplete, {
        [GA_PARAMS.gameCleared]: true,
        [GA_PARAMS.bufferSkipped]: skipped,
        [GA_PARAMS.bufferDwellMs]: Math.round(getDwellMs()),
        [GA_PARAMS.gameReplayCount]: replayCount,
        [GA_PARAMS.gameDurationMs]: result.durationMs,
        ...getModeParams(result),
      });
      completeGame({ cleared: true, bufferSkipped: skipped });
      navigate(PATHS.result);
    });
  };

  // 중도 이탈은 버퍼를 거치지 않는다 (기획 §2)
  const quit = (result: PlayResult) => {
    fireOnce(() => {
      if (gameMode !== null) {
        trackEvent(GA_EVENTS.gameAbandon, {
          [GA_PARAMS.gameMode]: gameMode,
          [GA_PARAMS.progressRatio]: result.progress,
        });
        trackEvent(GA_EVENTS.gameComplete, {
          [GA_PARAMS.gameCleared]: false,
          [GA_PARAMS.bufferSkipped]: true,
          [GA_PARAMS.bufferDwellMs]: 0,
          [GA_PARAMS.gameReplayCount]: replayCount,
          [GA_PARAMS.gameDurationMs]: result.durationMs,
          ...getModeParams(result),
        });
      }
      completeGame({ cleared: false });
      navigate(PATHS.result);
    });
  };

  // key={replayCount}로 PullGame이 리마운트되며 게이지·홀드·애니메이션이 초기화된다 (기획 §3-2)
  const replay = () => {
    incrementReplayCount();
    setPhase({ name: 'playing' });
  };

  const endPlay = (result: PlayResult) => {
    setPhase({ name: 'buffer', result });
  };

  useEffect(() => {
    if (gameMode === null) navigate(PATHS.measure, { replace: true });
  }, [gameMode, navigate]);

  // 진입은 PageLayout이 안내한다. 이 마운트 중 "한 번 더"로 replayCount가 늘어 다시 playing이 될 때만 여기서 안내한다
  const initialReplayCountRef = useRef(replayCount);
  useEffect(() => {
    if (replayCount > initialReplayCountRef.current && phase.name === 'playing') {
      focusHeading(document.querySelector('main') ?? document);
    }
  }, [replayCount, phase.name]);

  useEffect(() => {
    [...RESULT_PAGE_PRELOAD, ...BUFFER_PRELOAD].forEach((src) => {
      new Image().src = src;
    });
  }, []);

  if (gameMode === null) {
    return null;
  }

  if (phase.name === 'buffer') {
    return (
      <ArousalBuffer
        topMessage={BUFFER_TOP_MESSAGE[gameMode]}
        footer={(ctx) => {
          if (gameMode === 'scratch') {
            return (
              <Button
                onClick={() => finish(phase.result, ctx)}
                data-testid={BUFFER_TEST_IDS.nextAction}
              >
                다음 ▸
              </Button>
            );
          }

          if (replayCount >= MAX_PULL_REPLAYS) {
            return (
              <div className={styles.enoughFooter}>
                <p className={styles.enoughText} data-testid={BUFFER_TEST_IDS.enoughMessage}>
                  충분히 했어요. 이제 결과를 볼까요?
                </p>
                <Button
                  onClick={() => finish(phase.result, ctx)}
                  data-testid={BUFFER_TEST_IDS.nextAction}
                >
                  다음 ▸
                </Button>
              </div>
            );
          }

          return (
            <>
              <Button variant="outline" onClick={replay} data-testid={BUFFER_TEST_IDS.replayAction}>
                한 번 더 뽑기
              </Button>
              <Button
                onClick={() => finish(phase.result, ctx)}
                data-testid={BUFFER_TEST_IDS.nextAction}
              >
                다음 ▸
              </Button>
            </>
          );
        }}
      />
    );
  }

  if (gameMode === 'pull') {
    return <PullGame key={replayCount} onNext={endPlay} onQuit={quit} />;
  }

  return <ScratchGame onNext={endPlay} onQuit={quit} />;
}
