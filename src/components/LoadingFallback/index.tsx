import styles from './index.module.css';

export default function LoadingFallback() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.spinner} />
    </div>
  );
}
