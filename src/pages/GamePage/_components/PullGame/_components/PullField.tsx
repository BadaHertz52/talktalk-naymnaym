import { clsx } from 'clsx';
import { ASSETS } from '@game/assets';
import styles from '../index.module.css';

const DIRT_HEIGHT_RATIO = 96 / 398;

interface PullFieldProps {
  progress: number;
  hitCount: number;
  completed: boolean;
  resting: boolean;
}

export default function PullField({ progress, hitCount, completed, resting }: PullFieldProps) {
  const bunnyOffset = (1 - progress / 100) * DIRT_HEIGHT_RATIO * 100;

  return (
    <div className={styles.fieldSlot}>
      <div
        role="group"
        aria-label="당근 뽑기 무대 — Space, Enter, 화살표 키로 뽑아요"
        tabIndex={0}
        className={styles.field}
      >
        {!completed && (
          <p className={styles.hint}>
            {resting ? '쉬어도 괜찮아요. 준비되면 이어서 해요.' : getHint(progress)}
          </p>
        )}
        <div className={styles.bunnyArea}>
          {completed ? (
            <img
              src={ASSETS.pull.success}
              alt="당근을 뽑아 든 토끼"
              className={clsx(styles.bunnyImage, styles.success)}
            />
          ) : (
            <div
              className={styles.bunnyLayer}
              style={{ transform: `translateY(${bunnyOffset}cqh)` }}
            >
              <img
                key={hitCount}
                src={ASSETS.pull.bunny}
                alt="당근을 뽑는 토끼"
                className={clsx(styles.bunnyImage, hitCount > 0 && styles.shake)}
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
  if (progress >= 90) return '조금만 더!';
  if (progress >= 60) return '거의 올라왔어요';
  return '흙이 조금씩 움직여요';
}
