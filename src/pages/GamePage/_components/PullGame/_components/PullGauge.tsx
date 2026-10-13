import { useId } from 'react';
import styles from '../index.module.css';

interface PullGaugeProps {
  progress: number;
}

export default function PullGauge({ progress }: PullGaugeProps) {
  const labelId = useId();
  const displayedProgress = Math.floor(progress);

  return (
    <div className={styles.gauge}>
      <div className={styles.gaugeLabel}>
        <span id={labelId}>파워 게이지</span>
        <span aria-hidden="true">{displayedProgress}%</span>
      </div>
      <div
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuenow={displayedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        className={styles.track}
      >
        <div className={styles.fill} style={{ width: `${displayedProgress}%` }} />
      </div>
    </div>
  );
}
