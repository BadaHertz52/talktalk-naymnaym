import type { ChangeEvent, PointerEvent } from 'react';
import clsx from 'clsx';
import styles from './index.module.css';
import type { EmotionIntensity } from '../../types/session';

interface Props {
  value: EmotionIntensity | null;
  onChange: (value: EmotionIntensity) => void;
  valueText?: string;
  labelledBy?: string;
}

const SEGMENT_COUNT = 10;

// 값이 없을 때 range 내부값. 끝값(1)이면 iOS VoiceOver 스와이프·TalkBack 볼륨키 같은 AT 조절은
// 키 이벤트가 아니라서 아래 방향 조절 시 change가 안 일어난다. 중간값이면 어느 쪽이든 change가 발생한다
const UNSET_INTERNAL_VALUE = 5;

export default function IntensitySlider({ value, onChange, valueText, labelledBy }: Props) {
  const filledSegments = value ?? 0;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    onChange(Number(e.target.value) as EmotionIntensity);

  const handlePointerUp = (e: PointerEvent<HTMLInputElement>) => {
    if (value === null) onChange(Number(e.currentTarget.value) as EmotionIntensity);
  };

  return (
    <div className={styles.container}>
      <div className={styles.scaleLabels} aria-hidden="true">
        <span>약함 · 1</span>
        <span className={styles.scaleLabelCurrent}>
          {filledSegments ? `현재 ${filledSegments}` : '선택 안 됨'}
        </span>
        <span>10 · 강함</span>
      </div>
      <div className={styles.trackWrap}>
        <input
          type="range"
          className={styles.input}
          min={1}
          max={SEGMENT_COUNT}
          step={1}
          value={value ?? UNSET_INTERNAL_VALUE}
          aria-label={labelledBy ? undefined : '감정 강도'}
          aria-labelledby={labelledBy}
          aria-valuetext={value ? (valueText ?? String(value)) : '선택 안 됨'}
          onChange={handleChange}
          onPointerUp={handlePointerUp}
        />
        <div className={styles.track} aria-hidden="true">
          {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
            <div key={i} className={clsx(styles.segment, i < filledSegments && styles.filled)} />
          ))}
        </div>
      </div>
    </div>
  );
}
