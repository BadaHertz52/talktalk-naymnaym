import styles from './index.module.css';

interface Props {
  step: string;
}

export default function PageHeader({ step }: Props) {
  return (
    <div className={styles.header}>
      <span className={styles.brand}>톡톡냠냠</span>
      <span className={styles.step}>{step}</span>
    </div>
  );
}
