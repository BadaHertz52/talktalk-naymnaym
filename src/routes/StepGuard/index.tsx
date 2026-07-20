import { Navigate, Outlet } from 'react-router-dom';
import { useSessionStore } from '@stores/sessionStore';
import type { Step } from '@/types/session';

export function StepGuard({ requires }: { requires: Step[] }) {
  const steps = useSessionStore((s) => s.steps);
  const done = requires.every((step) => steps[step].completed);

  return done ? <Outlet /> : <Navigate to="/" replace />;
}
