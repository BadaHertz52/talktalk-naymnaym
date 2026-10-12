import { clsx } from 'clsx';
import type { MouseEvent } from 'react';
import Button from '@components/Button';
import { PULL_GAME_TEST_IDS } from '../../../_constants/pullGameTestIds';
import type { IdleLevel } from '../_hooks/usePullIdleLevel';
import styles from '../index.module.css';

interface PullActionsProps {
  completed: boolean;
  idleLevel: IdleLevel;
  onQuit: () => void;
  onArmNext: () => void;
  onNextClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onResetPrimaryClickSuppression: () => void;
  onTap: () => void;
  onPrimaryClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

export default function PullActions({
  completed,
  idleLevel,
  onQuit,
  onArmNext,
  onNextClick,
  onResetPrimaryClickSuppression,
  onTap,
  onPrimaryClick,
}: PullActionsProps) {
  const isIdleEmphasis = idleLevel === 'slow' || idleLevel === 'rest';

  return (
    <div className={styles.actionGroup}>
      {completed ? (
        <Button
          className={styles.mainButton}
          onPointerDown={onArmNext}
          onClick={onNextClick}
          data-testid={PULL_GAME_TEST_IDS.nextAction}
        >
          다음 ▸
        </Button>
      ) : (
        <Button
          variant="outline"
          className={styles.mainButton}
          onPointerDown={onResetPrimaryClickSuppression}
          onPointerUp={onTap}
          data-pull-primary
          data-testid={PULL_GAME_TEST_IDS.pullAction}
          onClick={onPrimaryClick}
        >
          {isIdleEmphasis ? '천천히 해도 괜찮아요' : '영차! 뽑기'}
        </Button>
      )}
      <button
        type="button"
        className={clsx(
          styles.textButton,
          styles.quitButton,
          isIdleEmphasis && styles.quitEmphasis,
        )}
        onClick={onQuit}
        data-testid={PULL_GAME_TEST_IDS.quitAction}
      >
        여기까지 할래요 ▸
      </button>
    </div>
  );
}
