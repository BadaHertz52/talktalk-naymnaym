const HINT_NEAR = 70;
const HINT_CLOSE = 90;

export type PullHintLevel = 'start' | 'progress' | 'near' | 'close' | 'rest';

export const HINT_TEXT: Record<PullHintLevel, string> = {
  start: '당근을 뽑아보세요',
  progress: '당근을 뽑는 중이에요',
  near: '거의 올라왔어요',
  close: '조금만 더!',
  rest: '쉬어도 괜찮아요. 준비되면 이어서 해요.',
};

export function getPullHint({ progress, resting }: { progress: number; resting: boolean }) {
  const level = getLevel({ progress, resting });

  return { level, text: HINT_TEXT[level] };
}

function getLevel({ progress, resting }: { progress: number; resting: boolean }): PullHintLevel {
  if (resting) return 'rest';
  // 진행률은 줄지 않으므로 0이면 아직 뽑기 전이다
  if (progress === 0) return 'start';
  if (progress >= HINT_CLOSE) return 'close';
  if (progress >= HINT_NEAR) return 'near';

  return 'progress';
}
