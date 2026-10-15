import { configDefaults, defineConfig } from 'vitest/config';

// 게임 로직(src/game)은 순수 TS라 기본은 node 환경.
// 컴포넌트 테스트가 필요한 파일은 파일 상단에 `// @vitest-environment jsdom` 주석을 달아 개별 오버라이드한다.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    // e2e/는 Playwright 전용 - Vitest가 집으면 안 된다
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
