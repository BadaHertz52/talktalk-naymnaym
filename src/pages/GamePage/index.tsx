import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameMode } from '@/types/session';
import { useSessionStore } from '@stores/sessionStore';
import { RESULT_PAGE_PRELOAD } from '@game/assets';
import { PATHS } from '@constants/paths';
import { GA_EVENTS } from '@constants/analytics';
import { trackEvent } from '@utils/analytics';
import { useFireOnce } from '@hooks/useFireOnce';
import Button from '@/components/Button';
import ScratchGame from './_components/ScratchGame';
import ArousalBuffer from './_components/ArousalBuffer';

const BUFFER_TOP_MESSAGE: Record<GameMode, string> = {
  scratch: '글자 다 지웠어요!',
  pull: '당근 다 뽑았어요!',
};

export default function GamePage() {
  const navigate = useNavigate();
  const gameMode = useSessionStore((s) => s.steps.measure.data.gameMode);
  const completeGame = useSessionStore((s) => s.completeGame);
  const fireOnce = useFireOnce();
  const [phase, setPhase] = useState<'playing' | 'buffer'>('playing');

  const finish = () => {
    fireOnce(() => {
      completeGame({ cleared: true });
      trackEvent(GA_EVENTS.gameComplete);
      navigate(PATHS.result);
    });
  };

  // 중도 이탈은 버퍼를 거치지 않는다 (기획 §2)
  const quit = () => {
    fireOnce(() => {
      completeGame({ cleared: false });
      navigate(PATHS.result);
    });
  };

  useEffect(() => {
    if (gameMode === null) navigate(PATHS.measure, { replace: true });
  }, [gameMode, navigate]);

  useEffect(() => {
    RESULT_PAGE_PRELOAD.forEach((src) => {
      new Image().src = src;
    });
  }, []);

  if (gameMode === null) {
    return null;
  }

  if (phase === 'buffer') {
    return (
      <ArousalBuffer
        topMessage={BUFFER_TOP_MESSAGE[gameMode]}
        footer={() => <Button onClick={finish}>다음 ▸</Button>}
      />
    );
  }

  return <ScratchGame onNext={() => setPhase('buffer')} onQuit={quit} />;
}
