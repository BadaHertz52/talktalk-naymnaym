import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import PullActions from './_components/PullActions';
import PullField from './_components/PullField';
import PullGauge from './_components/PullGauge';
import PullInstructions from './_components/PullInstructions';
import { usePullIdleLevel } from './_hooks/usePullIdleLevel';
import { usePullSession } from './_hooks/usePullSession';
import { PULL_GAME_TEST_IDS } from '../../_constants/pullGameTestIds';
import styles from './index.module.css';

const PERCENT_MAX = 100;
const COMPLETE_ANNOUNCEMENT = '당근 다 뽑았어요!';

export interface PullPlayResult {
  mode: 'pull';
  durationMs: number;
  pullTaps: number;
  pullInputMethod: 'tap' | 'hold' | 'mixed';
  // game_abandon용 0~1
  progress: number;
}

interface Props {
  onNext: (result: PullPlayResult) => void;
  onQuit: (result: PullPlayResult) => void;
}

export default function PullGame({ onNext, onQuit }: Props) {
  const mountedAtRef = useRef(performance.now());
  const completedDurationRef = useRef<number | null>(null);
  const session = usePullSession({ onNext: () => onNext(buildResult()) });
  // 완료 순간에 확정해 "다음 ▸"까지의 대기가 섞이지 않게 한다. 반복 플레이는 리마운트되므로 마지막 플레이 기준
  const buildResult = (): PullPlayResult => ({
    mode: 'pull',
    durationMs:
      completedDurationRef.current ?? Math.round(performance.now() - mountedAtRef.current),
    ...session.getStats(),
    progress: session.progress / PERCENT_MAX,
  });
  const { progress, inputCount, holding, completed } = session;
  const idleLevel = usePullIdleLevel({ inputCount, holding, completed });

  useEffect(() => {
    if (completed)
      completedDurationRef.current ??= Math.round(performance.now() - mountedAtRef.current);
  }, [completed]);

  return (
    <section
      className={clsx(styles.pullGame, idleLevel !== 'none' && styles.idle)}
      data-testid={PULL_GAME_TEST_IDS.screen}
      data-idle-level={idleLevel}
    >
      <div className={styles.contentGroup}>
        <PullInstructions />
        <PullField progress={progress} completed={completed} resting={idleLevel === 'rest'} />
        <PullGauge progress={progress} />
      </div>

      <PullActions
        completed={completed}
        idleLevel={idleLevel}
        onQuit={() => onQuit(buildResult())}
        onArmNext={session.armNext}
        onNextClick={session.handleNextClick}
        onResetPrimaryClickSuppression={session.resetPrimaryClickSuppression}
        onTap={session.tap}
        onPrimaryClick={session.handlePrimaryClick}
      />

      <p
        className={styles.srOnly}
        aria-live="polite"
        data-testid={PULL_GAME_TEST_IDS.completionAnnouncement}
      >
        {completed ? COMPLETE_ANNOUNCEMENT : ''}
      </p>
    </section>
  );
}
