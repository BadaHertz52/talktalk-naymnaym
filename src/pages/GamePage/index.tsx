import { useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@stores/sessionStore';
import { useGameCanvas } from './_hooks/useGameCanvas';
import { ASSETS } from '@game/assets';
import { PATHS } from '@constants/paths';
import styles from './index.module.css';
import Button from '@/components/Button';

export default function GamePage() {
  const navigate = useNavigate();
  const { emotionText, secretMode } = useSessionStore((s) => s.steps.input.data);
  const completeGame = useSessionStore((s) => s.completeGame);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeNextButton, setActiveNextButton] = useState(false);

  const enableNextStep = useCallback(() => {
    setActiveNextButton(true);
  }, []);

  const handleNext = useCallback(() => {
    completeGame();
    navigate(PATHS.result);
  }, [completeGame, navigate]);

  // 시크릿 모드에서는 캔버스 커버에도 원문이 그려지지 않도록 마스킹 후 전달 (InputPage와 동일한 마스킹 문자)
  const coverText = secretMode ? emotionText.replace(/[^\s]/g, '■') : emotionText;
  const { progress, cursor } = useGameCanvas({
    canvasRef,
    emotionText: coverText,
    enableNextStep,
  });

  return (
    <>
      <h1 className={styles.heading}>냠냠… 없애는 중</h1>
      <p className={styles.sub}>당근을 움직여 글자를 지워보세요.</p>
      <div className={styles.field}>
        <div className={styles.eatingImgWrapper}>
          <img src={ASSETS.bunny.eating} alt="당근을 먹는 토끼" className={styles.eatingImg} />
        </div>
        <canvas ref={canvasRef} tabIndex={0} className={styles.canvas} />
        <img
          src={ASSETS.carrot.full}
          alt=""
          aria-hidden="true"
          className={styles.carrotImg}
          style={cursor ? { left: cursor.x, top: cursor.y } : undefined}
        />
      </div>
      <p className={styles.progress} aria-live="polite">
        사라지는 중 {Math.round(progress * 100)}%
      </p>
      <Button className={styles.button} onClick={handleNext} disabled={!activeNextButton}>
        다음 ▸
      </Button>
    </>
  );
}
