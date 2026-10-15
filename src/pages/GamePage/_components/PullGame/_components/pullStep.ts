const STEP_PERCENT = 5;
// 95%에서 맨 위에 닿는다. 100%는 성공 이미지로 전환되므로 위치 단계에 포함하지 않는다
export const PULL_STEP_MAX = 100 / STEP_PERCENT - 1;

export function getPullStep(progress: number): number {
  return Math.min(Math.floor(progress / STEP_PERCENT), PULL_STEP_MAX);
}
