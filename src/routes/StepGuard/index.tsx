import { Navigate, Outlet } from 'react-router-dom';
import { useSessionStore } from '@stores/sessionStore';
import type { Step } from '@/types/session';

export function StepGuard({ requires }: { requires: Step[] }) {
  const done = useSessionStore((s) => requires.every((step) => s.steps[step].completed));

  return done ? <Outlet /> : <Navigate to="/" replace />;
}
