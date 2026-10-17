import { useRef, useCallback, useState } from 'react';
import { clsx } from 'clsx';
import { useSessionStore } from '@stores/sessionStore';
import { useGameCanvas } from '../../_hooks/useGameCanvas';
import { ASSETS } from '@game/assets';
import Button from '@components/Button';
import { SCRATCH_GAME_TEST_IDS } from '../../_constants/gameTestIds';
import QuitButton from '../QuitButton';
import { SCRATCH_DONE_ANNOUNCEMENT, SCRATCH_SCRUBBING_ANNOUNCEMENT } from './announcements';
import styles from './index.module.css';

export interface ScratchPlayResult {
  mode: 'scratch';
  durationMs: number;
  scratchRatio: number;
  // game_abandon용 0~1 (scratchRatio와 같은 값)
  progress: number;
}

interface Props {
  onNext: (result: ScratchPlayResult) => void;
  onQuit: (result: ScratchPlayResult) => void;
}

function getAnnouncement({ ended, scratching }: { ended: boolean; scratching: boolean }) {
  if (ended) return SCRATCH_DONE_ANNOUNCEMENT;
  if (scratching) return SCRATCH_SCRUBBING_ANNOUNCEMENT;

  return '';
}

export default function ScratchGame({ onNext, onQuit }: Props) {
  const { emotionText, secretMode } = useSessionStore((s) => s.steps.input.data);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const carrotRef = useRef<HTMLImageElement>(null);
  const [ended, setEnded] = useState(false);
  const mountedAtRef = useRef(performance.now());
  const completedDurationRef = useRef<number | null>(null);

  const enableNextStep = useCallback(() => {
    completedDurationRef.current ??= Math.round(performance.now() - mountedAtRef.current);
    setEnded(true);
  }, []);

  const { progress } = useGameCanvas({
    canvasRef,
    carrotRef,
    emotionText,
    secretMode,
    enableNextStep,
  });
  // 완료 순간에 확정해 "다음 ▸"까지의 대기가 섞이지 않게 한다. 반복 플레이는 리마운트되므로 마지막 플레이 기준
  const buildResult = (): ScratchPlayResult => ({
    mode: 'scratch',
    durationMs:
      completedDurationRef.current ?? Math.round(performance.now() - mountedAtRef.current),
    scratchRatio: progress,
    progress,
  });
  // 실제 지운 비율은 70%에서 멈추지만, 하드 종료가 "다 지웠다"로 읽히도록 게이지는 100%로 채운다 (기획 §3-4)
  const announcement = getAnnouncement({ ended, scratching: progress > 0 });
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
          data-testid={SCRATCH_GAME_TEST_IDS.canvas}
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
        data-testid={SCRATCH_GAME_TEST_IDS.progress}
        data-percent={percent}
      >
        사라지는 중 {percent}%
      </p>
      <p
        className={styles.srOnly}
        aria-live="polite"
        data-testid={SCRATCH_GAME_TEST_IDS.announcement}
      >
        {announcement}
      </p>
      <Button
        onClick={() => onNext(buildResult())}
        disabled={!ended}
        data-testid={SCRATCH_GAME_TEST_IDS.nextAction}
      >
        다음 ▸
      </Button>
      <QuitButton
        className={styles.quitButton}
        onClick={() => onQuit(buildResult())}
        data-testid={SCRATCH_GAME_TEST_IDS.quitAction}
      />
    </>
  );
}
