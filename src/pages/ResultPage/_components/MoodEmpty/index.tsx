import { ASSETS } from '@game/assets';
import styles from './index.module.css';

export default function MoodEmpty() {
  return (
    <div className={styles.moodEmpty}>
      <img
        src={ASSETS.bunny.expression[5]}
        alt=""
        aria-hidden="true"
        className={styles.moodSingle}
      />
      <p className={styles.resultTitle}>
        지금 남아있는
        <br />
        감정의 무게를 선택해보세요
      </p>
    </div>
  );
}
