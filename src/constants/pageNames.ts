import { PATHS } from './paths';

export const APP_NAME = '톡톡냠냠';

export const PAGE_NAMES: Record<string, string> = {
  [PATHS.home]: APP_NAME,
  [PATHS.input]: '감정 적기',
  [PATHS.measure]: '감정 무게 재기',
  [PATHS.game]: '없애는 중',
  [PATHS.result]: '감정 무게 다시 재기',
  [PATHS.end]: '마무리',
  [PATHS.notFound]: '페이지를 찾을 수 없어요',
};
