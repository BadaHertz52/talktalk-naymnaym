import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { APP_NAME, PAGE_NAMES } from '@constants/pageNames';
import PageHeader from '../PageHeader';
import { focusHeading } from './focusHeading';
import { isInitialLocation, rememberInitialLocation } from './initialLocation';
import styles from './index.module.css';

interface Props {
  showHeader?: boolean;
  className?: string;
  children?: ReactNode;
  pageName?: string;
}

// 스크린리더 사용자에게 SPA 라우트 변경을 알리려고 제목에 포커스를 옮긴다.
// 최초 엔트리는 브라우저가 이미 페이지 로드를 알리므로 제외한다.
export default function PageLayout({ showHeader, className, children, pageName }: Props) {
  const location = useLocation();
  rememberInitialLocation(location);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const { pathname } = location;
    const name = pageName ?? PAGE_NAMES[pathname];
    if (name) {
      document.title = name === APP_NAME ? APP_NAME : `${name} — ${APP_NAME}`;
    }

    const main = mainRef.current;
    if (isInitialLocation(location) || !main) return;

    // showModal된 dialog가 남아 있으면 배경이 inert라 focus()가 무시된다 — 닫힌 뒤에 옮긴다
    const dialog = document.querySelector('dialog[open]');
    if (dialog) {
      const handleClose = () => focusHeading(main);
      dialog.addEventListener('close', handleClose, { once: true });

      return () => dialog.removeEventListener('close', handleClose);
    }

    if (focusHeading(main)) return;

    // lazy 페이지(GamePage)는 청크 로드 후에야 h1이 생긴다
    const startActive = document.activeElement;
    const observer = new MutationObserver(() => {
      const active = document.activeElement;
      const userMoved = active && active !== document.body && active !== startActive;
      if (userMoved || focusHeading(main)) observer.disconnect();
    });
    observer.observe(main, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [location, pageName]);

  return (
    <main ref={mainRef} className={clsx(styles.main, className)}>
      {showHeader && <PageHeader />}
      {children ?? <Outlet />}
    </main>
  );
}
