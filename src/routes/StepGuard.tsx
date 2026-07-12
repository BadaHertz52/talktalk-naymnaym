import { Navigate, Outlet } from 'react-router-dom'
import { useSessionStore } from '../stores/sessionStore'
import type { Step } from '../types/session'

export function StepGuard({ requires }: { requires: Step }) {
  const completed = useSessionStore((s) => s.completed)
  return completed[requires] ? <Outlet /> : <Navigate to="/" replace />
}
