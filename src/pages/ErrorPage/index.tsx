import { isRouteErrorResponse, Navigate, useNavigate, useRouteError } from 'react-router-dom';
import { PATHS } from '@constants/paths';
import Button from '@components/Button';
import PageLayout from '@components/PageLayout';
import styles from './index.module.css';

export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <Navigate to={PATHS.notFound} replace />;
  }

  // 이 앱은 loader/action 기반 데이터 패칭이 없어 "다시 시도"가 곧 새로고침과 동치다.
  // 나중에 데이터 패칭 레이어가 생기면 useRevalidator() 등으로 재검토할 것.
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate(PATHS.home);
  };

  return (
    <PageLayout showHeader>
      <div className={styles.content}>
        <h1 className={styles.title}>!</h1>
        <h2 className={styles.description}>문제가 발생했어요</h2>
        <p className={styles.hint}>
          요청을 처리하는 중 오류가 발생했습니다.
          <br />
          잠시 후 다시 시도해주세요.
        </p>
      </div>
      <div className={styles.actions}>
        <Button className={styles.button} onClick={handleReload}>
          새로 고침
        </Button>
        <Button className={styles.button} variant="outline" onClick={handleGoHome}>
          홈으로 이동
        </Button>
      </div>
    </PageLayout>
  );
}
