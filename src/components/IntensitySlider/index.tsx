import { useRef, useCallback } from 'react';
import type { PointerEvent, KeyboardEvent } from 'react';
import styles from './index.module.css';
import { SEGMENT_COUNT, posToSegments } from './posToSegments';
import type { EmotionIntensity } from '../../types/session';

interface Props {
  value: EmotionIntensity | null;
  onChange: (value: EmotionIntensity) => void;
}

export default function IntensitySlider({ value, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const filledSegments = value ?? 0;

  const commitSegments = useCallback(
    (segments: number) => {
      const clamped = Math.max(1, Math.min(SEGMENT_COUNT, segments)) as EmotionIntensity;
      onChange(clamped);
    },
    [onChange],
  );

  const handlePointer = useCallback(
    (e: PointerEvent) => {
      if (!trackRef.current) return;

      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = trackRef.current.getBoundingClientRect();
      commitSegments(posToSegments(e.clientX - rect.left, rect.width));
    },
    [commitSegments],
  );

  const handleMove = useCallback(
    (e: PointerEvent) => {
      if (e.buttons === 0) return;

      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      commitSegments(posToSegments(e.clientX - rect.left, rect.width));
    },
    [commitSegments],
  );

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') commitSegments(filledSegments + 1);
      if (e.key === 'ArrowLeft') commitSegments(filledSegments - 1);
      if (e.key === 'Home') commitSegments(1);
      if (e.key === 'End') commitSegments(SEGMENT_COUNT);
    },
    [filledSegments, commitSegments],
  );

  return (
    <div className={styles.container}>
      <div className={styles.scaleLabels}>
        <span>약함 · 1</span>
        <span className={styles.scaleLabelCurrent}>
          {filledSegments ? `현재 ${filledSegments}` : '선택 안 됨'}
        </span>
        <span>10 · 강함</span>
      </div>
      <div
        ref={trackRef}
        className={styles.track}
        role="slider"
        aria-valuemin={1}
        aria-valuemax={SEGMENT_COUNT}
        aria-valuenow={value ?? 1}
        aria-valuetext={value ? String(value) : '선택 안 됨'}
        aria-label="감정 강도"
        tabIndex={0}
        onPointerDown={handlePointer}
        onPointerMove={handleMove}
        onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
        onPointerCancel={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
        onKeyDown={handleKey}
      >
        {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
          <div
            key={i}
            className={`${styles.segment}${i < filledSegments ? ` ${styles.filled}` : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
