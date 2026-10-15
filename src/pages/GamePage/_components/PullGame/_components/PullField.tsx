import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { ASSETS } from '@game/assets';
import { PULL_GAME_TEST_IDS } from '../../../_constants/pullGameTestIds';
import styles from '../index.module.css';
import { getPullStep, getTapShakePx, PULL_STEP_MAX } from './pullStep';

const DIRT_HEIGHT_RATIO = 96 / 398;
const HINT_NEAR = 70;
const HINT_CLOSE = 90;

interface PullFieldProps {
  progress: number;
  inputCount: number;
  completed: boolean;
  resting: boolean;
}

export default function PullField({ progress, inputCount, completed, resting }: PullFieldProps) {
  const bunnyOffset = (1 - getPullStep(progress) / PULL_STEP_MAX) * DIRT_HEIGHT_RATIO * 100;
  const shakeRef = useRef<HTMLDivElement>(null);

  // hold는 inputCount가 늘지 않으므로 탭에서만 흔들린다. 리마운트 없이 data 속성 토글로 CSS 애니메이션을 재생하고 animationend에서 해제한다
  useEffect(() => {
    const el = shakeRef.current;
    if (inputCount === 0 || !el) return;

    // progress는 inputCount와 같은 렌더에서 함께 바뀌므로 이 클로저의 값이 탭 직후 진행률이다
    el.dataset.shake = String(getTapShakePx(progress));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 탭(inputCount 증가)에만 반응해야 한다. hold로 progress만 바뀔 때는 흔들지 않는다
  }, [inputCount]);

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
              <div
                ref={shakeRef}
                className={styles.shakeLayer}
                onAnimationEnd={(e) => delete e.currentTarget.dataset.shake}
              >
                <img
                  src={ASSETS.pull.bunny}
                  alt="당근을 뽑는 토끼"
                  className={styles.bunnyImage}
                  data-testid={PULL_GAME_TEST_IDS.pullingVisual}
                />
              </div>
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
