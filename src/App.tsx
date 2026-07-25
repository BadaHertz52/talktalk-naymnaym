import { useEffect } from 'react';
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

  return <RouterProvider router={router} />;
}
