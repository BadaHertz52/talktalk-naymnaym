import { useRef, useCallback } from 'react';
import type { PointerEvent } from 'react';
import styles from './index.module.css';

const SEGMENT_COUNT = 10;

interface Props {
  value: number | null;
  onChange: (segments: number) => void;
}

function posToSegments(x: number, width: number): number {
  if (width === 0) return 1;
  const ratio = Math.max(0, Math.min(1, x / width));
  return Math.max(1, Math.ceil(ratio * SEGMENT_COUNT));
}

export default function IntensitySlider({ value, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const filledSegments = value ?? 0;

  const commitSegments = useCallback(
    (segments: number) => {
      onChange(Math.max(1, Math.min(SEGMENT_COUNT, segments)));
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
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') commitSegments(filledSegments + 1);
      if (e.key === 'ArrowLeft') commitSegments(filledSegments - 1);
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
        aria-valuenow={value ?? undefined}
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
