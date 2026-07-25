import { useNavigate } from 'react-router-dom';
import { PATHS } from '@constants/paths';
import Button from '@components/Button';
import PageLayout from '@components/PageLayout';
import styles from './index.module.css';

export default function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate(PATHS.home);
  };

  return (
    <PageLayout showHeader>
      <div className={styles.content}>
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.description}>페이지를 찾을 수 없어요.</h2>
      </div>
      <Button className={styles.button} onClick={handleGoHome}>
        홈으로 돌아가기
      </Button>
    </PageLayout>
  );
}
