import type { GameMode } from '@/types/session';

// 1개면 모드 선택 모달 없이 그 모드로 직행한다 — ['scratch']로 줄이면 v1.0.0 동선으로 롤백된다
export const ENABLED_GAME_MODES: readonly GameMode[] = ['scratch', 'pull'];
