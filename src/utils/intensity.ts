import type { EmotionExpressionStep, EmotionIntensity } from '@/types/session';

export function toExpressionStep(intensity: EmotionIntensity): EmotionExpressionStep {
  return Math.ceil(intensity / 2) as EmotionExpressionStep;
}
