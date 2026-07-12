import { defineConfig } from 'vitest/config';

// 게임 로직(src/game)은 순수 TS라 node 환경에서 테스트.
// 컴포넌트 테스트가 필요해지면 그때 jsdom 환경을 추가한다. (ponytail: YAGNI)
export default defineConfig({
  test: {
    environment: 'node',
  },
});
