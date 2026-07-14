import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../stores/sessionStore';
import { ASSETS } from '../../game/assets';
import { PATHS } from '../../constants/paths';
import Button from '../../components/Button';
import Mascot from '../../components/Mascot';
import styles from './index.module.css';

export default function EndPage() {
  const navigate = useNavigate();
  const reset = useSessionStore((s) => s.reset);

  const handleExit = () => {
    reset();
    navigate(PATHS.home);
  };

  return (
    <>
      <div className={styles.center}>
        <Mascot src={ASSETS.bunny.idle} alt="토끼 마스코트" />
        <h1 className={styles.title}>
          오늘은
          <br />
          여기까지
        </h1>
        <p className={styles.description}>
          적은 건 사라졌어요.
          <br />또 무거워지면 언제든 들러요.
        </p>
      </div>
      <Button className={styles.button} onClick={handleExit}>
        홈으로 돌아가기
      </Button>
    </>
  );
}
