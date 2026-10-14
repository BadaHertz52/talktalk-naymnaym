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

interface Props {
  onNext: () => void;
  onQuit: (progress: number) => void;
}

export default function PullGame({ onNext, onQuit }: Props) {
  const session = usePullSession({ onNext });
  const { progress, inputCount, holding, completed } = session;
  const idleLevel = usePullIdleLevel({ inputCount, holding, completed });
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
        onQuit={() => onQuit(progress / PERCENT_MAX)}
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
