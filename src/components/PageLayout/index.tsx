import { Outlet } from 'react-router-dom';
import PageHeader from '../PageHeader';
import styles from './index.module.css';

interface Props {
  step?: string;
}

export default function PageLayout({ step }: Props) {
  return (
    <main className={styles.main}>
      {step && <PageHeader step={step} />}
      <Outlet />
    </main>
  );
}
