import type { EmotionExpressionStep, EmotionIntensity } from '@/types/session';
import { ASSETS } from '@game/assets';
import ArrowIcon from '../ArrowIcon';
import styles from './index.module.css';

interface Props {
  expressionStep: EmotionExpressionStep;
  intensity: EmotionIntensity | null;
  intensityBefore: EmotionIntensity | null;
}

export default function MoodNotDecreased({ expressionStep, intensity, intensityBefore }: Props) {
  return (
    <div className={styles.moodNotDecreased}>
      <img
        src={ASSETS.bunny.expression[expressionStep]}
        alt=""
        aria-hidden="true"
        className={styles.moodSingle}
      />
      <p className={styles.resultTitle}>
        오늘은
        <br />
        여기까지도 충분해요
      </p>
      <div className={styles.scoreRow}>
        <span className={styles.scoreBefore}>{intensityBefore}</span>
        <ArrowIcon color="var(--color-gray-mid)" />
        <span className={styles.scoreBefore}>{intensity}</span>
      </div>
      <p className={styles.resultNote}>
        덜어지지 않는 날도 있어요.
        <br />
        속상한 마음은 여기에 적은 것만으로도 충분해요.
      </p>
    </div>
  );
}
