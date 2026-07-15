import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PATHS } from '../../constants/paths';
import styles from './index.module.css';

export default function PageHeader() {
  const { key } = useLocation();
  const navigate = useNavigate();
  const canGoBack = key !== 'default';
  const showBackButton = canGoBack;

  return (
    <div className={styles.header}>
      {showBackButton && (
        <button
          type="button"
          className={styles.back}
          onClick={() => navigate(-1)}
          aria-label="이전 페이지로 이동"
        >
          ‹
        </button>
      )}
      <Link to={PATHS.home} className={styles.brand} aria-label="톡톡냠냠 홈으로 이동">
        톡톡냠냠
      </Link>
    </div>
  );
}
