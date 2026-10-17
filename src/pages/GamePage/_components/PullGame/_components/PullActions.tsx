import { clsx } from 'clsx';
import type { MouseEvent, RefObject } from 'react';
import Button from '@components/Button';
import QuitButton from '../../QuitButton';
import { PULL_GAME_TEST_IDS } from '../../../_constants/pullGameTestIds';
import type { IdleLevel } from '../_hooks/usePullIdleLevel';
import { IDLE_PULL_ARIA_LABEL, IDLE_PULL_LABEL, PULL_LABEL } from '../pullActionLabels';
import styles from '../index.module.css';

interface PullActionsProps {
  completed: boolean;
  nextRef: RefObject<HTMLButtonElement | null>;
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
  nextRef,
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
          key="next"
          ref={nextRef}
          className={styles.mainButton}
          onPointerDown={onArmNext}
          onClick={onNextClick}
          data-testid={PULL_GAME_TEST_IDS.nextAction}
        >
          다음 ▸
        </Button>
      ) : (
        <Button
          key="pull"
          variant="outline"
          className={styles.mainButton}
          onPointerDown={onResetPrimaryClickSuppression}
          onPointerUp={onTap}
          data-pull-primary
          data-testid={PULL_GAME_TEST_IDS.pullAction}
          onClick={onPrimaryClick}
          aria-label={isIdleEmphasis ? IDLE_PULL_ARIA_LABEL : undefined}
        >
          {isIdleEmphasis ? IDLE_PULL_LABEL : PULL_LABEL}
        </Button>
      )}
      <QuitButton
        className={clsx(styles.quitButton, isIdleEmphasis && styles.quitEmphasis)}
        onClick={onQuit}
        data-testid={PULL_GAME_TEST_IDS.quitAction}
      />
    </div>
  );
}
