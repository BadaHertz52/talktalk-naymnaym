import styles from './index.module.css';

export default function LoadingFallback() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span>게임 화면을 불러오는 중입니다.</span>
      <div className={styles.spinner} aria-hidden="true" />
    </div>
  );
}
