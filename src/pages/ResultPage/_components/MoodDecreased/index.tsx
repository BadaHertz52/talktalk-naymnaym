import type { EmotionExpressionStep, EmotionIntensity } from '@/types/session';
import { ASSETS } from '@game/assets';
import ArrowIcon from '../ArrowIcon';
import styles from './index.module.css';

const STRIP_GROW = [52, 52, 52, 56, 66] as const;

const EMOTION_STEPS: EmotionExpressionStep[] = [1, 2, 3, 4, 5];

interface Props {
  expressionStep: EmotionExpressionStep;
  intensity: EmotionIntensity | null;
  intensityBefore: EmotionIntensity | null;
}

export default function MoodDecreased({ expressionStep, intensity, intensityBefore }: Props) {
  return (
    <div className={styles.decreasedMood}>
      <p className={styles.resultTitle} style={{ color: 'var(--color-primary)' }}>
        한결 가벼워졌어요
      </p>
      <div className={styles.moodStrip}>
        {EMOTION_STEPS.map((lvl, i) => (
          <img
            key={`emotion-${lvl}`}
            src={ASSETS.bunny.expression[lvl]}
            alt=""
            aria-hidden="true"
            style={{
              flexGrow: STRIP_GROW[i],
              opacity: lvl === expressionStep ? 1 : 0.3,
            }}
            className={styles.moodImg}
          />
        ))}
      </div>
      <div className={styles.scoreRow}>
        <span className={styles.scoreBefore}>{intensityBefore}</span>
        <ArrowIcon color="var(--color-primary)" />
        <span className={styles.scoreAfter}>{intensity}</span>
      </div>
    </div>
  );
}
