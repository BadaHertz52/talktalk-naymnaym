import { Outlet } from 'react-router-dom';
import PageHeader from '../PageHeader';
import styles from './index.module.css';

interface Props {
  showHeader?: boolean;
}

export default function PageLayout({ showHeader }: Props) {
  return (
    <main className={styles.main}>
      {showHeader && <PageHeader />}
      <Outlet />
    </main>
  );
}
