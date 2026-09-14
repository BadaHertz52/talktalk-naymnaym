import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@stores/sessionStore';
import { ASSETS } from '@game/assets';
import { PATHS } from '@constants/paths';
import Button from '@components/Button';
import Mascot from '@components/Mascot';
import styles from './index.module.css';

export default function HomePage() {
  const navigate = useNavigate();
  const emotionText = useSessionStore((s) => s.steps.input.data.emotionText);
  const reset = useSessionStore((s) => s.reset);

  useEffect(() => {
    if (emotionText) reset();
  }, [emotionText, reset]);

  return (
    <div className={styles.page}>
      <Mascot src={ASSETS.bunny.cart} alt="톡톡냠냠 마스코트 토끼" />
      <h1 className={styles.title}>톡톡냠냠</h1>
      <p className={styles.description}>
        참았던 말들, 눌러뒀던 감정
        <br />
        토끼에게 털어놓고 냠냠 없애버리세요
      </p>
      <Button className={styles.button} onClick={() => navigate(PATHS.input)}>
        시작하기 ▸
      </Button>
    </div>
  );
}
