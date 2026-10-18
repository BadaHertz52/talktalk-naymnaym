import { useNavigate } from 'react-router-dom';
import { PATHS } from '@constants/paths';
import Button from '@components/Button';
import PageLayout from '@components/PageLayout';
import styles from './index.module.css';
import { NOT_FOUND_TEST_IDS } from './testIds';

export default function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate(PATHS.home);
  };

  return (
    <PageLayout showHeader>
      <div className={styles.content} data-testid={NOT_FOUND_TEST_IDS.page}>
        <p className={styles.title} aria-hidden="true">
          404
        </p>
        <h1 className={styles.description}>페이지를 찾을 수 없어요.</h1>
      </div>
      <Button
        className={styles.button}
        onClick={handleGoHome}
        data-testid={NOT_FOUND_TEST_IDS.homeAction}
      >
        홈으로 돌아가기
      </Button>
    </PageLayout>
  );
}
