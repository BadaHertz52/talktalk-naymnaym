import { clsx } from 'clsx';
import { ASSETS } from '@game/assets';
import { PULL_GAME_TEST_IDS } from '../../../_constants/pullGameTestIds';
import styles from '../index.module.css';
import { getPullStep, PULL_STEP_MAX } from './pullStep';

const DIRT_HEIGHT_RATIO = 96 / 398;
const HINT_NEAR = 70;
const HINT_CLOSE = 90;

interface PullFieldProps {
  progress: number;
  completed: boolean;
  resting: boolean;
}

export default function PullField({ progress, completed, resting }: PullFieldProps) {
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
          <p
            className={styles.hint}
            data-testid={PULL_GAME_TEST_IDS.hint}
            data-level={resting ? 'rest' : getHintLevel(progress)}
          >
            {resting ? '쉬어도 괜찮아요. 준비되면 이어서 해요.' : getHint(progress)}
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

function getHint(progress: number): string {
  if (progress >= HINT_CLOSE) return '조금만 더!';
  if (progress >= HINT_NEAR) return '거의 올라왔어요';
  return '흙이 조금씩 움직여요';
}

function getHintLevel(progress: number): 'progress' | 'near' | 'close' {
  if (progress >= HINT_CLOSE) return 'close';
  if (progress >= HINT_NEAR) return 'near';
  return 'progress';
}
