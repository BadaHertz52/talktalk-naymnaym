import { useEffect } from 'react';
import { overlay, OverlayProvider } from 'overlay-kit';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes/router';
import { useSessionStore } from '@stores/sessionStore';

export default function App() {
  const hasUnsavedEmotionText = useSessionStore((s) =>
    Boolean(s.steps.input.data.emotionText || s.steps.result.data.afterEmotionText),
  );

  useEffect(() => {
    if (!hasUnsavedEmotionText) return;

    const warnBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', warnBeforeUnload);

    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [hasUnsavedEmotionText]);

  useEffect(() => {
    // OverlayProvider는 라우트 트리 밖에서 한 번만 마운트되므로, 오버레이를 연 페이지가
    // 언마운트(라우트 이동)돼도 열려있던 confirm/alert가 새 페이지 위에 남아있는다.
    // 경로가 바뀔 때마다 전부 닫아 정리한다.
    let pathname = router.state.location.pathname;

    return router.subscribe((state) => {
      if (state.location.pathname === pathname) return;

      pathname = state.location.pathname;
      overlay.closeAll();
    });
  }, []);

  return (
    <OverlayProvider>
      <RouterProvider router={router} />
    </OverlayProvider>
  );
}
