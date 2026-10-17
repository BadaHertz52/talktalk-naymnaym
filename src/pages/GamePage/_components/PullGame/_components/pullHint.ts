const HINT_NEAR = 70;
const HINT_CLOSE = 90;

export type PullHintLevel = 'progress' | 'near' | 'close' | 'rest';

const HINT_TEXT: Record<PullHintLevel, string> = {
  progress: '흙이 조금씩 움직여요',
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
  if (progress >= HINT_CLOSE) return 'close';
  if (progress >= HINT_NEAR) return 'near';

  return 'progress';
}
