import { defineConfig } from 'vitest/config';

// 게임 로직(src/game)은 순수 TS라 기본은 node 환경.
// 컴포넌트 테스트가 필요한 파일은 파일 상단에 `// @vitest-environment jsdom` 주석을 달아 개별 오버라이드한다.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
  },
});
