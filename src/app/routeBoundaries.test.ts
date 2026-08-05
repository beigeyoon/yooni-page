import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// loading.tsx는 그 자리에 Suspense 경계를 만들고, Next.js는 경계를 만나면 셸을
// 먼저 흘려보낸다. 셸이 나간 시점에 응답 상태는 200으로 굳으므로, 그 아래에서
// notFound()를 던져도 404 화면만 바뀔 뿐 상태 코드는 200으로 남는다(소프트 404).
// 크롤러는 없는 주소를 정상 페이지로 색인하고 크롤 예산을 낭비한다.
//
// 그래서 notFound()가 도달할 수 있는 서브트리 위에는 loading.tsx를 두면 안 된다.
// 로딩 오버레이가 필요하면 클라이언트 전환 쪽(GlobalLoading)에서 처리한다.

const APP_DIR = path.join(__dirname);

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(APP_DIR);

const loadingFiles = files.filter(f => path.basename(f) === 'loading.tsx');

function subtreeTriggersNotFound(dir: string): boolean {
  return walk(dir).some(file => {
    if (path.basename(file) === 'not-found.tsx') return true;
    if (!/\.tsx?$/.test(file) || file.endsWith('.test.ts')) return false;
    return /\bnotFound\s*\(/.test(readFileSync(file, 'utf8'));
  });
}

describe('app 라우트 경계', () => {
  it('notFound()가 닿는 서브트리 위에 loading.tsx가 없다', () => {
    const offenders = loadingFiles
      .filter(file => subtreeTriggersNotFound(path.dirname(file)))
      .map(file => path.relative(APP_DIR, file));

    expect(offenders).toEqual([]);
  });
});
