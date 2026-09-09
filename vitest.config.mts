import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  // tsconfig의 jsx: preserve는 Next 컴파일러용이라 테스트에서는 자동 런타임으로 변환한다.
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    // 기본은 node. 컴포넌트 테스트는 파일 상단의 `@vitest-environment jsdom`으로 선택한다.
    environment: 'node'
  }
});
