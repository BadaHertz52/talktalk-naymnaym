import { useId } from 'react';
import { clsx } from 'clsx';
import Button from '@components/Button';
import { ASSETS } from '@game/assets';
import { usePullIdleLevel } from './_hooks/usePullIdleLevel';
import { usePullSession } from './_hooks/usePullSession';
import styles from './index.module.css';

const DIRT_HEIGHT_RATIO = 96 / 398;
const COMPLETE_ANNOUNCEMENT = '당근 다 뽑았어요!';

interface Props {
  onNext: () => void;
  onQuit: () => void;
}

function getHint(progress: number): string {
  if (progress >= 90) {
    return '조금만 더!';
  }

  if (progress >= 60) {
    return '거의 올라왔어요';
  }

  return '흙이 조금씩 움직여요';
}

export default function PullGame({ onNext, onQuit }: Props) {
  const session = usePullSession({ onNext });
  const { progress, hitCount, inputCount, holding, completed } = session;
  const idleLevel = usePullIdleLevel({ inputCount, holding, completed });
  const gaugeLabelId = useId();
  const displayedProgress = Math.floor(progress);
  const t = progress / 100;
  const bunnyOffset = (1 - t) * DIRT_HEIGHT_RATIO * 100;

  return (
    <section className={clsx(styles.pullGame, idleLevel !== 'none' && styles.idle)}>
      <div className={styles.contentGroup}>
        <h1 className={styles.heading}>냠냠… 뽑는 중</h1>
        <div className={styles.instructions}>
          <div className={styles.instructionRow}>
            <span className={styles.instructionLabel}>한 번 뽑기 -</span>
            <span>스페이스바, 엔터, ⬆️ 또는 뽑기 버튼 누르기</span>
          </div>
          <div className={styles.instructionRow}>
            <span className={styles.instructionLabel}>쭈욱 뽑기 -</span>
            <span>스페이스바 + ⬆️ 꾹 누르기</span>
          </div>
        </div>

        <div className={styles.fieldSlot}>
          <div
            role="group"
            aria-label="당근 뽑기 무대 — Space, Enter, 화살표 키로 뽑아요"
            tabIndex={0}
            className={styles.field}
          >
            {!completed && (
              <p className={styles.hint}>
                {idleLevel === 'rest'
                  ? '쉬어도 괜찮아요. 준비되면 이어서 해요.'
                  : getHint(progress)}
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
                  style={{
                    transform: `translateY(${bunnyOffset}cqh)`,
                  }}
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

        <div className={styles.gauge}>
          <div className={styles.gaugeLabel}>
            <span id={gaugeLabelId}>파워 게이지</span>
            <span aria-hidden="true">{displayedProgress}%</span>
          </div>
          <div
            role="progressbar"
            aria-labelledby={gaugeLabelId}
            aria-valuenow={displayedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            className={styles.track}
          >
            <div className={styles.fill} style={{ width: `${displayedProgress}%` }} />
          </div>
        </div>
      </div>

      <div className={styles.actionGroup}>
        {completed ? (
          <Button
            className={styles.mainButton}
            onPointerDown={session.armNext}
            onClick={session.handleNextClick}
          >
            다음 ▸
          </Button>
        ) : (
          <Button
            variant="outline"
            className={styles.mainButton}
            onPointerDown={session.resetPrimaryClickSuppression}
            onPointerUp={session.tap}
            data-pull-primary
            onClick={session.handlePrimaryClick}
          >
            {idleLevel === 'slow' || idleLevel === 'rest' ? '천천히 해도 괜찮아요' : '영차! 뽑기'}
          </Button>
        )}
        <button
          type="button"
          className={clsx(
            styles.textButton,
            styles.quitButton,
            (idleLevel === 'slow' || idleLevel === 'rest') && styles.quitEmphasis,
          )}
          onClick={onQuit}
        >
          여기까지 할래요 ▸
        </button>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {completed ? COMPLETE_ANNOUNCEMENT : ''}
      </p>
    </section>
  );
}
