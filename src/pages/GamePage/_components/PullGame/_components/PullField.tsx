import { clsx } from 'clsx';
import { ASSETS } from '@game/assets';
import { PULL_GAME_TEST_IDS } from '../../../_constants/pullGameTestIds';
import styles from '../index.module.css';
import type { getPullHint } from '../_utils/pullHint';
import { getPullStep, PULL_STEP_MAX } from '../_utils/pullStep';

const DIRT_HEIGHT_RATIO = 96 / 398;

interface PullFieldProps {
  progress: number;
  completed: boolean;
  hint: ReturnType<typeof getPullHint>;
}

export default function PullField({ progress, completed, hint }: PullFieldProps) {
  const bunnyOffset = (1 - getPullStep(progress) / PULL_STEP_MAX) * DIRT_HEIGHT_RATIO * 100;

  return (
    <div className={styles.fieldSlot}>
      <div
        role="group"
        aria-label="당근 뽑기 무대 — Space, Enter, 화살표 키로 뽑아요"
        tabIndex={0}
        className={styles.field}
        data-testid={completed ? PULL_GAME_TEST_IDS.completionState : undefined}
      >
        {!completed && (
          <p className={styles.hint} data-testid={PULL_GAME_TEST_IDS.hint} data-level={hint.level}>
            {hint.text}
          </p>
        )}
        <div className={styles.bunnyArea}>
          {completed ? (
            <img
              src={ASSETS.pull.success}
              alt="당근을 뽑아 든 토끼"
              className={clsx(styles.bunnyImage, styles.success)}
              data-testid={PULL_GAME_TEST_IDS.successVisual}
            />
          ) : (
            <div
              className={styles.bunnyLayer}
              style={{ transform: `translateY(${bunnyOffset}cqh)` }}
            >
              <img
                src={ASSETS.pull.bunny}
                alt="당근을 뽑는 토끼"
                className={styles.bunnyImage}
                data-testid={PULL_GAME_TEST_IDS.pullingVisual}
              />
            </div>
          )}
        </div>
        <div className={styles.dirt} aria-hidden="true">
          <img src={ASSETS.pull.dirt} alt="" />
          <img src={ASSETS.pull.dirt} alt="" />
        </div>
        {completed && (
          <p className={styles.clear} aria-hidden="true">
            CLEAR!!
          </p>
        )}
      </div>
    </div>
  );
}
