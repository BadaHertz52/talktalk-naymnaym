import { useRef, useCallback, useState } from 'react';
import { clsx } from 'clsx';
import { useSessionStore } from '@stores/sessionStore';
import { useGameCanvas } from '../../_hooks/useGameCanvas';
import { ASSETS } from '@game/assets';
import Button from '@components/Button';
import { SCRATCH_GAME_TEST_IDS } from '../../_constants/gameTestIds';
import styles from './index.module.css';

interface Props {
  onNext: () => void;
  onQuit: (progress: number) => void;
}

export default function ScratchGame({ onNext, onQuit }: Props) {
  const { emotionText, secretMode } = useSessionStore((s) => s.steps.input.data);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const carrotRef = useRef<HTMLImageElement>(null);
  const [ended, setEnded] = useState(false);

  const enableNextStep = useCallback(() => {
    setEnded(true);
  }, []);

  const { progress } = useGameCanvas({
    canvasRef,
    carrotRef,
    emotionText,
    secretMode,
    enableNextStep,
  });
  // 실제 지운 비율은 70%에서 멈추지만, 하드 종료가 "다 지웠다"로 읽히도록 게이지는 100%로 채운다 (기획 §3-4)
  const percent = ended ? 100 : Math.round(progress * 100);

  return (
    <>
      <h1 className={styles.heading} data-testid={SCRATCH_GAME_TEST_IDS.heading}>
        냠냠… 없애는 중
      </h1>
      <p className={styles.sub}>당근을 움직여 글자를 지워보세요.</p>
      <div className={styles.field}>
        <div className={styles.eatingImgWrapper}>
          <img src={ASSETS.bunny.eating} alt="당근을 먹는 토끼" className={styles.eatingImg} />
        </div>
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className={styles.canvas}
          aria-label="글자 지우기 스크래치 영역"
        />
        <img
          ref={carrotRef}
          src={ASSETS.carrot.full}
          alt=""
          aria-hidden="true"
          className={styles.carrotImg}
        />
      </div>
      <p
        className={clsx(styles.progress, ended && styles.progressDone)}
        aria-live="polite"
        data-testid={SCRATCH_GAME_TEST_IDS.progress}
        data-percent={percent}
      >
        사라지는 중 {percent}%
      </p>
      <Button onClick={onNext} disabled={!ended} data-testid={SCRATCH_GAME_TEST_IDS.nextAction}>
        다음 ▸
      </Button>
      <button
        type="button"
        className={styles.quitButton}
        onClick={() => onQuit(progress)}
        data-testid={SCRATCH_GAME_TEST_IDS.quitAction}
      >
        여기까지 할래요 ▸
      </button>
    </>
  );
}
