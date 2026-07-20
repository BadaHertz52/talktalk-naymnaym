import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import PageHeader from '../PageHeader';
import styles from './index.module.css';

interface Props {
  showHeader?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function PageLayout({ showHeader, className, children }: Props) {
  return (
    <main className={`${styles.main}${className ? ` ${className}` : ''}`}>
      {showHeader && <PageHeader />}
      {children ?? <Outlet />}
    </main>
  );
}
