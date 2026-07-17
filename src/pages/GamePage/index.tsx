import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@stores/sessionStore';
import { useGameCanvas } from './_hooks/useGameCanvas';
import { ASSETS } from '@game/assets';
import { PATHS } from '@constants/paths';
import styles from './index.module.css';

export default function GamePage() {
  const navigate = useNavigate();
  const emotionText = useSessionStore((s) => s.steps.input.data.emotionText);
  const completeGame = useSessionStore((s) => s.completeGame);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleComplete = useCallback(() => {
    completeGame();
    navigate(PATHS.result);
  }, [completeGame, navigate]);

  const { progress } = useGameCanvas(canvasRef, emotionText, handleComplete);

  return (
    <>
      <h1 className={styles.heading}>냠냠… 없애는 중</h1>
      <p className={styles.sub}>당근을 움직여 글자를 지우보세요.</p>
      <div className={styles.field}>
        <img src={ASSETS.bunny.eating} alt="당근을 먹는 토끼" className={styles.eatingImg} />
        <canvas ref={canvasRef} tabIndex={0} className={styles.canvas} />
        <img src={ASSETS.carrot.full} alt="" aria-hidden="true" className={styles.carrotImg} />
      </div>
      <p className={styles.progress} aria-live="polite">
        사라지는 중 {Math.round(progress * 100)}%
      </p>
    </>
  );
}
