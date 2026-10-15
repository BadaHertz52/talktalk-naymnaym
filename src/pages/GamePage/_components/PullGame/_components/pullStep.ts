// 단계 진입 경계(%). 100%는 성공 이미지로 전환되므로 위치 단계에 포함하지 않는다
const STEP_BOUNDARIES = [20, 45, 70, 90] as const;

export const PULL_STEP_MAX = STEP_BOUNDARIES.length;

export function getPullStep(progress: number): number {
  return STEP_BOUNDARIES.filter((boundary) => progress >= boundary).length;
}

// 다음 단계 경계에 가까울수록(구간 후반) 흔들림이 커진다
export function getTapShakePx(progress: number): 1 | 2 {
  const step = getPullStep(progress);
  if (step >= PULL_STEP_MAX) return 1;

  const lower = step === 0 ? 0 : STEP_BOUNDARIES[step - 1];
  const upper = STEP_BOUNDARIES[step];

  return (progress - lower) / (upper - lower) >= 0.5 ? 2 : 1;
}
