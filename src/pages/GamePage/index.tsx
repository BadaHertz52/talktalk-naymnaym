import { useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../stores/sessionStore';
import { useGameCanvas } from '../../hooks/useGameCanvas';
import { ASSETS } from '../../game/assets';
import { PATHS } from '../../constants/paths';
import styles from './index.module.css';

export default function GamePage() {
  const navigate = useNavigate();
  const emotionText = useSessionStore((s) => s.emotionText);
  const completeGame = useSessionStore((s) => s.completeGame);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleComplete = useCallback(() => {
    completeGame();
    navigate(PATHS.result);
  }, [completeGame, navigate]);

  useGameCanvas(canvasRef, emotionText, handleComplete);

  // ponytail: 게임 로직(useGameCanvas) 미구현 상태에서 result 페이지 확인용 임시 타이머, 실제 게임 완료 콜백 연결 시 제거
  useEffect(() => {
    const timer = setTimeout(handleComplete, 1000);
    return () => clearTimeout(timer);
  }, [handleComplete]);

  return (
    <>
      <h1 className={styles.heading}>냠냠… 없애는 중</h1>
      <p className={styles.sub}>토끼가 당근을 굴려서, 지나간 자리의 글자가 사라져요.</p>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.eatingBox}>
        <img src={ASSETS.bunny.eating} alt="당근을 먹는 토끼" className={styles.eatingImg} />
      </div>
    </>
  );
}
